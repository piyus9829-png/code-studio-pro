import { ProjectTemplate } from '../types';

export const STARTER_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'cpp-algorithms-benchmark',
    name: 'C++ Dynamic Array & Algorithm Benchmark with Custom I/O',
    description: 'Competitive programming & algorithms in C++ with std::cin, std::cout, vectors, sorting, and binary search.',
    category: 'C / C++',
    icon: 'Terminal',
    defaultTab: 'console',
    defaultStdin: '8\n45 12 89 23 7 90 34 56\n',
    testCases: [
      {
        id: 'tc-1',
        name: 'Sample Test 1',
        input: '8\n45 12 89 23 7 90 34 56\n',
        expectedOutput: 'Sorted Array: [7, 12, 23, 34, 45, 56, 89, 90]\nMin Element: 7\nMax Element: 90\nSum: 356\nMean: 44.50',
      },
      {
        id: 'tc-2',
        name: 'Single Element Test',
        input: '1\n42\n',
        expectedOutput: 'Sorted Array: [42]\nMin Element: 42\nMax Element: 42\nSum: 42\nMean: 42.00',
      }
    ],
    activeFileName: 'main.cpp',
    files: [
      {
        name: 'main.cpp',
        language: 'cpp',
        content: `// CloudIDE Studio Pro - Modern C++ Engine
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

using namespace std;

int main() {
    cout << "🚀 Running Modern C++ Algorithm Suite" << endl;
    cout << "========================================" << endl;

    int n;
    // Read number of elements from standard input (cin)
    cin >> n;

    if (n <= 0) {
        cout << "Dataset size is empty or invalid." << endl;
        return 0;
    }

    vector<int> nums(n);
    int sum = 0;

    for (int i = 0; i < n; i++) {
        cin >> nums[i];
        sum += nums[i];
    }

    // Sort the dataset
    sort(nums);

    int minVal = nums[0];
    int maxVal = nums[n - 1];
    double mean = (double)sum / n;

    cout << "Sorted Array: [";
    for (int i = 0; i < n; i++) {
        cout << nums[i] << (i + 1 < n ? ", " : "");
    }
    cout << "]" << endl;

    cout << "Min Element: " << minVal << endl;
    cout << "Max Element: " << maxVal << endl;
    cout << "Sum: " << sum << endl;
    printf("Mean: %.2f\\n", mean);

    return 0;
}
`,
      },
      {
        name: 'header.h',
        language: 'cpp',
        content: `// Utility declarations
#pragma once
#include <vector>

void printVector(const std::vector<int>& v);
int binarySearch(const std::vector<int>& v, int target);
`,
      }
    ],
  },
  {
    id: 'c-matrix-multiplication',
    name: 'C Pointer Arithmetic & Matrix Engine',
    description: 'Fast matrix multiplication, pointer arithmetic, and formatted printf / scanf standard input in C.',
    category: 'C / C++',
    icon: 'Terminal',
    defaultTab: 'console',
    defaultStdin: '3\n1 2 3\n4 5 6\n7 8 9\n',
    testCases: [
      {
        id: 'tc-c1',
        name: '3x3 Identity Matrix Test',
        input: '3\n1 0 0\n0 1 0\n0 0 1\n',
        expectedOutput: 'Matrix Trace: 3\nMatrix Determinant Calculated.',
      }
    ],
    activeFileName: 'matrix.c',
    files: [
      {
        name: 'matrix.c',
        language: 'c',
        content: `// CloudIDE Studio Pro - C Pointer & Memory Sandbox
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("⚡ C Matrix Calculation Engine\\n");
    printf("----------------------------------------\\n");

    int n;
    // Read matrix size n
    scanf("%d", &n);

    printf("Allocating %dx%d integer grid from stdin...\\n", n, n);

    int matrix[10][10];
    int trace = 0;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            scanf("%d", &matrix[i][j]);
            if (i == j) {
                trace += matrix[i][j];
            }
        }
    }

    printf("Input Matrix Display:\\n");
    for (int i = 0; i < n; i++) {
        printf("  [ ");
        for (int j = 0; j < n; j++) {
            printf("%4d ", matrix[i][j]);
        }
        printf("]\\n");
    }

    printf("----------------------------------------\\n");
    printf("Matrix Trace (Diagonal Sum): %d\\n", trace);
    printf("Execution completed with exit code 0.\\n");

    return 0;
}
`,
      }
    ],
  },
  {
    id: 'js-data-analytics',
    name: 'JavaScript Data Analytics & Engine',
    description: 'Data transformation pipeline with statistical aggregations, formatted table output, and console timers.',
    category: 'JavaScript',
    icon: 'Layers',
    defaultTab: 'console',
    activeFileName: 'analytics.js',
    files: [
      {
        name: 'analytics.js',
        language: 'javascript',
        content: `// CloudIDE Studio Pro - JavaScript Data Analytics
console.log("🚀 Starting E-Commerce Analytics Engine...");
console.time("pipeline-processing");

const transactions = [
  { id: "TX1001", customer: "Sophia Taylor", category: "Electronics", amount: 1249.99, region: "North America", rating: 4.8 },
  { id: "TX1002", customer: "Liam Johnson", category: "Apparel", amount: 189.50, region: "Europe", rating: 4.2 },
  { id: "TX1003", customer: "Emma Williams", category: "Electronics", amount: 799.00, region: "Asia Pacific", rating: 4.9 },
  { id: "TX1004", customer: "Noah Brown", category: "Home & Garden", amount: 349.99, region: "North America", rating: 4.1 },
  { id: "TX1005", customer: "Olivia Martinez", category: "Electronics", amount: 2199.50, region: "Europe", rating: 5.0 },
  { id: "TX1006", customer: "Lucas Garcia", category: "Apparel", amount: 95.00, region: "Latin America", rating: 3.9 },
  { id: "TX1007", customer: "Ava Robinson", category: "Home & Garden", amount: 540.25, region: "North America", rating: 4.6 }
];

console.log(\`📦 Loaded \${transactions.length} verified transaction records.\`);

// Group and aggregate statistics
const categorySummary = transactions.reduce((acc, tx) => {
  if (!acc[tx.category]) {
    acc[tx.category] = { count: 0, totalRevenue: 0, avgRatingSum: 0 };
  }
  acc[tx.category].count += 1;
  acc[tx.category].totalRevenue += tx.amount;
  acc[tx.category].avgRatingSum += tx.rating;
  return acc;
}, {});

const summaryTable = Object.keys(categorySummary).map(cat => ({
  Category: cat,
  Orders: categorySummary[cat].count,
  Revenue: "$" + categorySummary[cat].totalRevenue.toFixed(2),
  AvgOrder: "$" + (categorySummary[cat].totalRevenue / categorySummary[cat].count).toFixed(2),
  AvgRating: (categorySummary[cat].avgRatingSum / categorySummary[cat].count).toFixed(2) + " ⭐"
}));

console.log("📊 Summary by Category:");
console.table(summaryTable);

const totalGross = transactions.reduce((sum, t) => sum + t.amount, 0);
console.log(\`💰 Total Gross Revenue: $\${totalGross.toFixed(2)}\`);

console.timeEnd("pipeline-processing");
`,
      }
    ],
  },
  {
    id: 'react-interactive-dashboard',
    name: 'React 19 Interactive Metrics Dashboard',
    description: 'Modern component with state hooks, reactive charts, and live browser preview.',
    category: 'React',
    icon: 'Layers',
    defaultTab: 'preview',
    activeFileName: 'App.jsx',
    files: [
      {
        name: 'App.jsx',
        language: 'javascript',
        content: `import React, { useState } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';

function App() {
  const [count, setCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            CloudIDE Live React
          </h1>
          <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
            v19.0 Ready
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-6">
          Full live interactive React sandbox with state management, Tailwind styling, and real-time DOM reconciliation.
        </p>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center mb-6">
          <div className="text-3xl font-extrabold text-white mb-1">{count}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Interactive Counter</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCount(c => c - 1)}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all active:scale-95 cursor-pointer"
          >
            - Decrement
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer"
          >
            + Increment
          </button>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
`,
      },
      {
        name: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100">
  <div id="root"></div>
</body>
</html>
`,
      }
    ],
  },
  {
    id: 'python-linear-regression',
    name: 'Python Linear Regression & Stats Engine',
    description: 'Statistical modeling, variance, covariance, Pearson correlation, and predictive forecasting.',
    category: 'Python',
    icon: 'Terminal',
    defaultTab: 'console',
    activeFileName: 'regression.py',
    files: [
      {
        name: 'regression.py',
        language: 'python',
        content: `# CloudIDE Studio Pro - Statistical Regression Engine
import math

print("📊 Initializing High-Dimensional Dataset...")

# Sample Data: (Ad Spend in $k, Revenue in $k)
data_x = [1.2, 2.5, 3.2, 4.8, 5.1, 6.7, 7.3, 8.9, 9.4, 10.8]
data_y = [5.1, 8.2, 10.4, 14.1, 15.6, 19.8, 22.1, 26.5, 28.0, 32.4]

n = len(data_x)

# 1. Descriptive Statistics
mean_x = sum(data_x) / n
mean_y = sum(data_y) / n

variance_x = sum((x - mean_x) ** 2 for x in data_x) / (n - 1)
std_dev_x = math.sqrt(variance_x)

variance_y = sum((y - mean_y) ** 2 for y in data_y) / (n - 1)
std_dev_y = math.sqrt(variance_y)

# 2. Linear Regression Fit (y = mx + c)
covariance_xy = sum((data_x[i] - mean_x) * (data_y[i] - mean_y) for i in range(n)) / (n - 1)
slope_m = covariance_xy / variance_x
intercept_c = mean_y - (slope_m * mean_x)

# Pearson Correlation Coefficient (r) and R^2
r = covariance_xy / (std_dev_x * std_dev_y)
r_squared = r ** 2

print(f"📊 Dataset Size: {n} observations")
print(f"📈 Mean Ad Spend: \\\${mean_x:.2f}k (StdDev: {std_dev_x:.2f})")
print(f"📈 Mean Revenue:  \\\${mean_y:.2f}k (StdDev: {std_dev_y:.2f})")
print("-" * 50)
print(f"✨ Fitted Model: Revenue = ({slope_m:.3f} * Spend) + {intercept_c:.3f}")
print(f"🎯 Correlation (r): {r:.4f}")
print(f"⭐️ R-Squared (R²): {r_squared:.4f} (Explains {r_squared*100:.1f}% variance)")
print("-" * 50)

# 3. Predict future values
test_spends = [12.0, 15.0, 20.0]
print("🔮 Revenue Forecasts:")
for spend in test_spends:
    pred = (slope_m * spend) + intercept_c
    print(f"  • For \\\${spend:.1f}k Ad Spend -> Projected Revenue: \\\${pred:.2f}k")
`,
      }
    ],
  },
  {
    id: 'python-datascience-pandas-numpy',
    name: 'Python Data Science Suite (NumPy, Pandas & Matplotlib)',
    description: 'Data analysis with Pandas DataFrames, NumPy vector math, linear regression, and Matplotlib visual figures.',
    category: 'Python',
    icon: 'Layers',
    defaultTab: 'charts',
    activeFileName: 'analysis.py',
    files: [
      {
        name: 'analysis.py',
        language: 'python',
        content: `# CloudIDE Studio Pro - Python Data Science Suite
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

print("🚀 Initializing NumPy, Pandas & Matplotlib Data Engine...")
print("=" * 60)

# 1. Load sample dataset using Pandas
df = pd.read_csv('sales.csv')
print("📊 Loaded Sales & Marketing Dataset:")
print(df.head(6))
print("-" * 60)

# 2. Vectorized NumPy Operations
revenues = np.array(df['revenue'])
marketings = np.array(df['marketing'])

mean_rev = np.mean(revenues)
std_rev = np.std(revenues)
roi_ratios = np.round(revenues / marketings, 2)

print(f"📈 Revenue Mean: \\\${mean_rev:,.2f} | StdDev: \\\${std_rev:,.2f}")
print(f"🎯 ROI Multipliers by Month: {roi_ratios.tolist()}")
print("-" * 60)

# 3. GroupBy Aggregation in Pandas
print("💼 Revenue by Geographic Region:")
region_summary = df.groupby('region').sum()
print(region_summary)
print("-" * 60)

# 4. Generate Visual Plots with Matplotlib
months = df['month'].tolist()

# Figure 1: Revenue vs Marketing Bar Comparison
plt.figure()
plt.title('Monthly Revenue Growth vs Marketing Investment')
plt.xlabel('Fiscal Month')
plt.ylabel('Amount in USD ($)')
plt.bar(months, revenues, label='Gross Revenue', color='#6366f1')
plt.bar(months, marketings, label='Marketing Spend', color='#06b6d4')
plt.grid(True)
plt.show()

# Figure 2: Scatter Correlation Plot
plt.figure()
plt.title('Marketing Spend vs Revenue Correlation')
plt.xlabel('Marketing Spend ($)')
plt.ylabel('Gross Revenue ($)')
plt.scatter(marketings, revenues)
plt.grid(True)
plt.show()

print("✨ Analysis and interactive chart visualization complete!")
`,
      }
    ],
  },
  {
    id: 'sql-multi-database-joins',
    name: 'SQL Relational RDBMS & Multi-Table Joins',
    description: 'In-memory relational database with orders, users, items, foreign key joins, and financial rollups.',
    category: 'Data & SQL',
    icon: 'Database',
    defaultTab: 'table',
    activeFileName: 'ecommerce_analytics.sql',
    files: [
      {
        name: 'ecommerce_analytics.sql',
        language: 'sql',
        content: `-- CloudIDE Studio Pro - In-Memory Relational Database Engine
-- Switch to the Preloaded E-Commerce Database
USE ecommerce_db;

-- 1. Inspect Available Tables in ecommerce_db
SHOW TABLES;

-- 2. Multi-Table Relational Join: User Orders & Financial Summary
SELECT 
  u.id AS user_id,
  u.name AS customer_name,
  u.country,
  o.id AS order_id,
  o.order_date,
  o.total_amount,
  o.status
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status != 'Cancelled'
ORDER BY o.total_amount DESC;

-- 3. Top Spending Customers Aggregation
SELECT 
  u.country,
  COUNT(o.id) AS total_orders,
  SUM(o.total_amount) AS gross_spend,
  AVG(o.total_amount) AS avg_order_value
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'Delivered'
GROUP BY u.country
ORDER BY gross_spend DESC;
`,
      }
    ],
  },
];
