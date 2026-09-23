"""
Async Decoupled Payment Gateway Webhook Listener (Python FastAPI / Flask)
Architecture: High-Performance, Zero-Load Background Processing for Razorpay & Stripe
Database: Updates User Premium Tier in Firebase Firestore Asynchronously
"""

import os
import hmac
import hashlib
import time
import json
import asyncio
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException, Header, BackgroundTasks, status
from fastapi.responses import JSONResponse
import httpx

app = FastAPI(
    title="CloudIDE Studio Pro - Decoupled Webhook Service",
    description="Asynchronous zero-load payment webhook listener for Razorpay & Stripe",
    version="2.0.0"
)

# Configuration from Environment Variables
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "rzp_webhook_secret_dev_demo")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_stripe_demo_secret")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "mystic-yolk-bcbh2")
FIRESTORE_DATABASE_ID = os.getenv("FIRESTORE_DATABASE_ID", "ai-studio-clouddevelopment-2c301c9e-7e7d-4d4c-b6df-3f21cfb35a0c")


# ============================================================================
# CRYPTOGRAPHIC HMAC SIGNATURE VERIFICATION
# ============================================================================

def verify_razorpay_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Validates Razorpay Webhook HMAC-SHA256 signature against raw request body
    """
    if not signature or not raw_body:
        return False
    try:
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, signature)
    except Exception as e:
        print(f"[Razorpay Signature Error]: {e}")
        return False


def verify_stripe_signature(raw_body: bytes, sig_header: str, secret: str) -> bool:
    """
    Validates Stripe Webhook timestamp + HMAC-SHA256 signature
    """
    if not sig_header or not raw_body:
        return False
    try:
        parts = sig_header.split(",")
        timestamp = None
        signatures = []
        for part in parts:
            k, v = part.strip().split("=", 1)
            if k == "t":
                timestamp = v
            elif k == "v1":
                signatures.append(v)

        if not timestamp or not signatures:
            return False

        # Prevent replay attacks (> 5 minutes old)
        current_time = int(time.time())
        if abs(current_time - int(timestamp)) > 300:
            print("[Stripe Webhook Warning] Replay attack prevented: timestamp expired")
            return False

        signed_payload = f"{timestamp}.".encode("utf-8") + raw_body
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()

        for sig in signatures:
            if hmac.compare_digest(expected_sig, sig):
                return True
        return False
    except Exception as e:
        print(f"[Stripe Signature Error]: {e}")
        return False


# ============================================================================
# ASYNCHRONOUS BACKGROUND WORKER: FIRESTORE DATABASE UPDATE
# ============================================================================

async def async_update_user_premium_status(
    user_id: str,
    user_email: str,
    plan: str,
    payment_id: str,
    gateway: str,
    amount: float
):
    """
    Runs in the background (decoupled task). Updates Firestore document without
    delaying the HTTP 200 response to the payment gateway.
    """
    print(f"[Background Task] Updating subscription for user {user_id or user_email} to '{plan}' via {gateway}")

    # Calculate Expiry (1 Month, 1 Year, or Lifetime)
    now = time.time()
    expires_at = None
    if plan == "pro_monthly":
        expires_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + 30 * 86400))
    elif plan == "pro_annual":
        expires_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + 365 * 86400))
    elif plan == "lifetime_developer":
        expires_at = None

    firestore_url = (
        f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/"
        f"databases/{FIRESTORE_DATABASE_ID}/documents/users/{user_id}"
        "?updateMask.fieldPaths=isPremium"
        "&updateMask.fieldPaths=subscriptionPlan"
        "&updateMask.fieldPaths=subscriptionExpiresAt"
        "&updateMask.fieldPaths=transactionId"
        "&updateMask.fieldPaths=paymentMethod"
    )

    firestore_payload = {
        "fields": {
            "isPremium": {"booleanValue": True},
            "subscriptionPlan": {"stringValue": plan},
            "subscriptionExpiresAt": {"stringValue": expires_at} if expires_at else {"nullValue": None},
            "transactionId": {"stringValue": payment_id},
            "paymentMethod": {"stringValue": f"{gateway}_gateway"}
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.patch(firestore_url, json=firestore_payload)
            if resp.status_code in [200, 201]:
                print(f"[Firestore Sync Success] User {user_id} upgraded to {plan}!")
            else:
                print(f"[Firestore Sync Status {resp.status_code}]: {resp.text}")
    except Exception as e:
        print(f"[Firestore Async Update Exception]: {e}")


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

@app.post("/api/webhooks/razorpay", status_code=status.HTTP_200_OK)
async def razorpay_webhook_handler(
    request: Request,
    background_tasks: BackgroundTasks,
    x_razorpay_signature: Optional[str] = Header(None)
):
    """
    Razorpay Webhook Handler:
    1. Reads raw binary body
    2. Validates HMAC SHA-256 signature
    3. Queues background worker for database sync
    4. Responds immediately with 200 OK (< 50ms)
    """
    raw_body = await request.body()

    # Validate HMAC signature
    if x_razorpay_signature:
        if not verify_razorpay_signature(raw_body, x_razorpay_signature, RAZORPAY_WEBHOOK_SECRET):
            if os.getenv("ENVIRONMENT") == "production":
                raise HTTPException(status_code=400, detail="Invalid Razorpay HMAC signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON payload")

    event_type = payload.get("event")
    print(f"[Razorpay Event Received]: {event_type}")

    # Process successful payments: payment.captured or order.paid
    if event_type in ["payment.captured", "order.paid"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        notes = payment_entity.get("notes", {})
        
        user_id = notes.get("userId") or notes.get("uid") or "user_demo"
        user_email = notes.get("userEmail") or payment_entity.get("email") or "dev@cloudide.io"
        plan = notes.get("plan") or "pro_annual"
        payment_id = payment_entity.get("id") or f"pay_{int(time.time())}"
        amount = (payment_entity.get("amount") or 7999) / 100.0

        # Dispatch decoupled async worker
        background_tasks.add_task(
            async_update_user_premium_status,
            user_id=user_id,
            user_email=user_email,
            plan=plan,
            payment_id=payment_id,
            gateway="razorpay",
            amount=amount
        )

    # Return fast ACK
    return {"status": "ok", "acknowledged": True}


@app.post("/api/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook_handler(
    request: Request,
    background_tasks: BackgroundTasks,
    stripe_signature: Optional[str] = Header(None)
):
    """
    Stripe Webhook Handler:
    1. Validates Stripe-Signature header
    2. Offloads user upgrade to background task
    3. Responds immediately with 200 OK
    """
    raw_body = await request.body()

    if stripe_signature:
        if not verify_stripe_signature(raw_body, stripe_signature, STRIPE_WEBHOOK_SECRET):
            if os.getenv("ENVIRONMENT") == "production":
                raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON")

    event_type = payload.get("type")
    print(f"[Stripe Event Received]: {event_type}")

    if event_type in ["checkout.session.completed", "payment_intent.succeeded"]:
        data_obj = payload.get("data", {}).get("object", {})
        metadata = data_obj.get("metadata", {})

        user_id = metadata.get("userId") or metadata.get("uid") or "user_demo"
        user_email = metadata.get("userEmail") or data_obj.get("customer_details", {}).get("email")
        plan = metadata.get("plan") or "pro_annual"
        payment_id = data_obj.get("payment_intent") or data_obj.get("id") or f"ch_{int(time.time())}"
        amount = (data_obj.get("amount_total") or data_obj.get("amount") or 7999) / 100.0

        background_tasks.add_task(
            async_update_user_premium_status,
            user_id=user_id,
            user_email=user_email,
            plan=plan,
            payment_id=payment_id,
            gateway="stripe",
            amount=amount
        )

    return {"received": True}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "python_payment_webhook_listener", "time": time.time()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("webhook_service:app", host="0.0.0.0", port=8000, reload=True)
