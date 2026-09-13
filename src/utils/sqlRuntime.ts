import { ConsoleLogEntry, ExecutionResult, SQLDatabaseSchema, SQLQueryPlanNode, SQLQueryResult, SQLTableSchema } from '../types';

let sqlLogCounter = 0;

function createSqlLog(type: ConsoleLogEntry['type'], args: any[]): ConsoleLogEntry {
  return {
    id: `sqllog_${Date.now()}_${++sqlLogCounter}`,
    type,
    args,
    timestamp: Date.now(),
  };
}

// Global In-Memory Database Registry
const INITIAL_DATABASES: Record<string, SQLDatabaseSchema> = {
  ecommerce_db: {
    name: 'ecommerce_db',
    description: 'E-Commerce Marketplace with users, products, orders, items & customer reviews',
    tables: {
      users: {
        name: 'users',
        rowCount: 6,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true, nullable: false },
          { name: 'name', type: 'VARCHAR(50)', nullable: false },
          { name: 'email', type: 'VARCHAR(100)', nullable: false },
          { name: 'country', type: 'VARCHAR(50)' },
          { name: 'balance', type: 'DECIMAL(10,2)' },
          { name: 'signup_date', type: 'DATE' },
        ],
        rows: [
          { id: 1, name: 'Alice Chen', email: 'alice@example.com', country: 'USA', balance: 1450.50, signup_date: '2023-01-15' },
          { id: 2, name: 'Bob Miller', email: 'bob@example.com', country: 'Canada', balance: 820.00, signup_date: '2023-02-20' },
          { id: 3, name: 'Chloe Dubois', email: 'chloe@example.fr', country: 'France', balance: 2900.25, signup_date: '2023-03-10' },
          { id: 4, name: 'David Kumar', email: 'david@example.in', country: 'India', balance: 640.75, signup_date: '2023-04-05' },
          { id: 5, name: 'Elena Rostov', email: 'elena@example.de', country: 'Germany', balance: 3120.00, signup_date: '2023-05-18' },
          { id: 6, name: 'Fiona Gallagher', email: 'fiona@example.uk', country: 'UK', balance: 120.00, signup_date: '2023-06-22' },
        ]
      },
      products: {
        name: 'products',
        rowCount: 8,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(100)', nullable: false },
          { name: 'category', type: 'VARCHAR(50)' },
          { name: 'price', type: 'DECIMAL(10,2)' },
          { name: 'stock', type: 'INT' },
          { name: 'rating', type: 'DECIMAL(3,1)' },
        ],
        rows: [
          { id: 101, name: 'MacBook Pro M3 Max', category: 'Laptops', price: 2499.00, stock: 35, rating: 4.9 },
          { id: 102, name: 'Dell XPS 15 OLED', category: 'Laptops', price: 1899.00, stock: 42, rating: 4.6 },
          { id: 103, name: 'Sony WH-1000XM5', category: 'Audio', price: 399.99, stock: 120, rating: 4.8 },
          { id: 104, name: 'Apple AirPods Pro 2', category: 'Audio', price: 249.00, stock: 210, rating: 4.7 },
          { id: 105, name: 'Logitech MX Master 3S', category: 'Accessories', price: 99.99, stock: 350, rating: 4.9 },
          { id: 106, name: 'Keychron Q1 Pro Wireless', category: 'Accessories', price: 199.00, stock: 85, rating: 4.5 },
          { id: 107, name: 'LG 27GP950 4K 144Hz', category: 'Monitors', price: 699.00, stock: 50, rating: 4.4 },
          { id: 108, name: 'Samsung Odyssey OLED G9', category: 'Monitors', price: 1399.00, stock: 18, rating: 4.8 },
        ]
      },
      orders: {
        name: 'orders',
        rowCount: 7,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'user_id', type: 'INT', isForeign: true, foreignTable: 'users', foreignColumn: 'id' },
          { name: 'order_date', type: 'DATE' },
          { name: 'total_amount', type: 'DECIMAL(10,2)' },
          { name: 'status', type: 'VARCHAR(20)' },
        ],
        rows: [
          { id: 501, user_id: 1, order_date: '2024-01-10', total_amount: 2898.99, status: 'Delivered' },
          { id: 502, user_id: 2, order_date: '2024-01-15', total_amount: 399.99, status: 'Delivered' },
          { id: 503, user_id: 3, order_date: '2024-02-01', total_amount: 2499.00, status: 'Delivered' },
          { id: 504, user_id: 1, order_date: '2024-02-14', total_amount: 99.99, status: 'Shipped' },
          { id: 505, user_id: 5, order_date: '2024-02-20', total_amount: 2098.00, status: 'Processing' },
          { id: 506, user_id: 4, order_date: '2024-03-02', total_amount: 699.00, status: 'Delivered' },
          { id: 507, user_id: 6, order_date: '2024-03-12', total_amount: 249.00, status: 'Cancelled' },
        ]
      },
      order_items: {
        name: 'order_items',
        rowCount: 8,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'order_id', type: 'INT', isForeign: true, foreignTable: 'orders', foreignColumn: 'id' },
          { name: 'product_id', type: 'INT', isForeign: true, foreignTable: 'products', foreignColumn: 'id' },
          { name: 'quantity', type: 'INT' },
          { name: 'unit_price', type: 'DECIMAL(10,2)' },
        ],
        rows: [
          { id: 1, order_id: 501, product_id: 101, quantity: 1, unit_price: 2499.00 },
          { id: 2, order_id: 501, product_id: 103, quantity: 1, unit_price: 399.99 },
          { id: 3, order_id: 502, product_id: 103, quantity: 1, unit_price: 399.99 },
          { id: 4, order_id: 503, product_id: 101, quantity: 1, unit_price: 2499.00 },
          { id: 5, order_id: 504, product_id: 105, quantity: 1, unit_price: 99.99 },
          { id: 6, order_id: 505, product_id: 102, quantity: 1, unit_price: 1899.00 },
          { id: 7, order_id: 505, product_id: 106, quantity: 1, unit_price: 199.00 },
          { id: 8, order_id: 506, product_id: 107, quantity: 1, unit_price: 699.00 },
        ]
      }
    }
  },
  university_db: {
    name: 'university_db',
    description: 'Academic records system with students, courses, faculty & enrollment grades',
    tables: {
      students: {
        name: 'students',
        rowCount: 5,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'name', type: 'VARCHAR(60)' },
          { name: 'major', type: 'VARCHAR(40)' },
          { name: 'gpa', type: 'DECIMAL(3,2)' },
          { name: 'enrollment_year', type: 'INT' },
        ],
        rows: [
          { id: 202101, name: 'Lucas Scott', major: 'Computer Science', gpa: 3.85, enrollment_year: 2021 },
          { id: 202102, name: 'Maya Patel', major: 'Data Science', gpa: 3.92, enrollment_year: 2021 },
          { id: 202201, name: 'Ethan Hunt', major: 'Electrical Engineering', gpa: 3.45, enrollment_year: 2022 },
          { id: 202202, name: 'Sophia Zhao', major: 'Computer Science', gpa: 3.78, enrollment_year: 2022 },
          { id: 202301, name: 'Liam O’Connor', major: 'Mathematics', gpa: 3.60, enrollment_year: 2023 },
        ]
      },
      courses: {
        name: 'courses',
        rowCount: 4,
        columns: [
          { name: 'code', type: 'VARCHAR(10)', isPrimary: true },
          { name: 'title', type: 'VARCHAR(80)' },
          { name: 'credits', type: 'INT' },
          { name: 'department', type: 'VARCHAR(40)' },
        ],
        rows: [
          { code: 'CS101', title: 'Data Structures & Algorithms', credits: 4, department: 'Computer Science' },
          { code: 'CS205', title: 'Database Management Systems', credits: 3, department: 'Computer Science' },
          { code: 'DS301', title: 'Machine Learning & AI', credits: 4, department: 'Data Science' },
          { code: 'MATH201', title: 'Linear Algebra & Calc III', credits: 3, department: 'Mathematics' },
        ]
      },
      enrollments: {
        name: 'enrollments',
        rowCount: 6,
        columns: [
          { name: 'id', type: 'INT', isPrimary: true },
          { name: 'student_id', type: 'INT', isForeign: true },
          { name: 'course_code', type: 'VARCHAR(10)', isForeign: true },
          { name: 'grade', type: 'VARCHAR(2)' },
          { name: 'term', type: 'VARCHAR(20)' },
        ],
        rows: [
          { id: 1, student_id: 202101, course_code: 'CS101', grade: 'A', term: 'Fall 2023' },
          { id: 2, student_id: 202101, course_code: 'CS205', grade: 'A-', term: 'Spring 2024' },
          { id: 3, student_id: 202102, course_code: 'DS301', grade: 'A+', term: 'Spring 2024' },
          { id: 4, student_id: 202201, course_code: 'CS101', grade: 'B+', term: 'Fall 2023' },
          { id: 5, student_id: 202202, course_code: 'CS205', grade: 'A', term: 'Spring 2024' },
          { id: 6, student_id: 202301, course_code: 'MATH201', grade: 'A', term: 'Fall 2023' },
        ]
      }
    }
  },
  finance_db: {
    name: 'finance_db',
    description: 'Banking & Portfolio Management with accounts, stock tickers & ledger transactions',
    tables: {
      accounts: {
        name: 'accounts',
        rowCount: 4,
        columns: [
          { name: 'account_no', type: 'VARCHAR(20)', isPrimary: true },
          { name: 'holder_name', type: 'VARCHAR(60)' },
          { name: 'type', type: 'VARCHAR(30)' },
          { name: 'balance', type: 'DECIMAL(12,2)' },
          { name: 'currency', type: 'VARCHAR(5)' },
        ],
        rows: [
          { account_no: 'ACC-88210', holder_name: 'Stark Industries', type: 'Corporate Checking', balance: 5400000.00, currency: 'USD' },
          { account_no: 'ACC-54120', holder_name: 'Wayne Enterprises', type: 'Investment Vault', balance: 8900000.00, currency: 'USD' },
          { account_no: 'ACC-11045', holder_name: 'Peter Parker', type: 'Personal Savings', balance: 1420.50, currency: 'USD' },
          { account_no: 'ACC-99431', holder_name: 'Diana Prince', type: 'Private Wealth', balance: 1250000.00, currency: 'EUR' },
        ]
      },
      stocks: {
        name: 'stocks',
        rowCount: 5,
        columns: [
          { name: 'ticker', type: 'VARCHAR(10)', isPrimary: true },
          { name: 'company', type: 'VARCHAR(60)' },
          { name: 'sector', type: 'VARCHAR(40)' },
          { name: 'price', type: 'DECIMAL(8,2)' },
          { name: 'pe_ratio', type: 'DECIMAL(6,2)' },
        ],
        rows: [
          { ticker: 'NVDA', company: 'Nvidia Corp', sector: 'Semiconductors', price: 125.50, pe_ratio: 42.8 },
          { ticker: 'GOOGL', company: 'Alphabet Inc', sector: 'Technology', price: 178.20, pe_ratio: 24.1 },
          { ticker: 'MSFT', company: 'Microsoft Corp', sector: 'Cloud & AI', price: 445.80, pe_ratio: 35.6 },
          { ticker: 'AAPL', company: 'Apple Inc', sector: 'Consumer Electronics', price: 220.40, pe_ratio: 31.2 },
          { ticker: 'AMZN', company: 'Amazon.com Inc', sector: 'E-Commerce & Cloud', price: 185.90, pe_ratio: 39.5 },
        ]
      }
    }
  }
};

// Global active database state
let databaseRegistry: Record<string, SQLDatabaseSchema> = JSON.parse(JSON.stringify(INITIAL_DATABASES));
let currentActiveDbName = 'ecommerce_db';

export function getAllDatabases(): Record<string, SQLDatabaseSchema> {
  return databaseRegistry;
}

export function getActiveDatabase(): SQLDatabaseSchema {
  if (!databaseRegistry[currentActiveDbName]) {
    currentActiveDbName = Object.keys(databaseRegistry)[0] || 'ecommerce_db';
  }
  return databaseRegistry[currentActiveDbName];
}

export function setActiveDatabaseName(name: string): void {
  if (databaseRegistry[name]) {
    currentActiveDbName = name;
  }
}

export function resetAllDatabases(): void {
  databaseRegistry = JSON.parse(JSON.stringify(INITIAL_DATABASES));
}

function inferColumnType(val: any): string {
  if (val === null || val === undefined) return 'VARCHAR';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'INT' : 'DECIMAL';
  }
  if (typeof val === 'boolean') return 'BOOLEAN';
  if (typeof val === 'object') return 'JSON';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return 'DATE';
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(String(val))) return 'DATETIME';
  return 'VARCHAR';
}

function inferColumnsFromRows(rows: Array<Record<string, any>>, colNames?: string[]): Array<{ name: string; type: string }> {
  if (rows.length === 0 && colNames) {
    return colNames.map(c => ({ name: c, type: 'VARCHAR' }));
  }
  if (rows.length === 0) return [];
  const keys = colNames || Object.keys(rows[0]);
  return keys.map(key => {
    let type = 'VARCHAR';
    for (const r of rows) {
      if (r[key] !== null && r[key] !== undefined) {
        type = inferColumnType(r[key]);
        break;
      }
    }
    return { name: key, type };
  });
}

/**
 * Execute SQL Statements on the In-Memory RDBMS Engine
 */
export function executeSQLScript(code: string, startTime: number, initialLogs: ConsoleLogEntry[]): ExecutionResult {
  const logs = [...initialLogs];
  let totalAffectedRowCount = 0;
  let lastResultTable: Array<Record<string, any>> | null = null;
  const legacyQueryResults: Array<{ query: string; columns: string[]; rows: any[]; rowCount: number; executionTimeMs: number }> = [];
  const sqlQueryResults: SQLQueryResult[] = [];

  try {
    const rawStatements = code
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let stmtIndex = 0;

    for (const statement of rawStatements) {
      stmtIndex++;
      const stmtStart = performance.now();
      const cleanStmt = statement.replace(/--.*$/gm, '').trim();
      if (!cleanStmt) continue;

      const startedAt = new Date().toLocaleTimeString();

      // 1. SHOW DATABASES
      if (/^SHOW\s+DATABASES/i.test(cleanStmt)) {
        const dbs = Object.keys(databaseRegistry).map(k => ({
          Database: k,
          TablesCount: Object.keys(databaseRegistry[k].tables).length,
          Description: databaseRegistry[k].description || ''
        }));
        lastResultTable = dbs;
        const dur = Math.round(performance.now() - stmtStart);
        logs.push(createSqlLog('info', [`📋 SHOW DATABASES (${dbs.length} available)`]));
        logs.push(createSqlLog('table', [dbs]));
        const typedCols = inferColumnsFromRows(dbs);
        legacyQueryResults.push({ query: cleanStmt, columns: Object.keys(dbs[0] || {}), rows: dbs, rowCount: dbs.length, executionTimeMs: dur });
        sqlQueryResults.push({
          id: `query_${stmtIndex}`,
          query: cleanStmt,
          columns: typedCols,
          rows: dbs,
          rowCount: dbs.length,
          executionTimeMs: dur,
          status: 'success',
          startedAt
        });
        continue;
      }

      // 2. USE <db_name>
      const useMatch = cleanStmt.match(/^USE\s+([a-zA-Z0-9_]+)/i);
      if (useMatch) {
        const dbName = useMatch[1];
        if (databaseRegistry[dbName]) {
          currentActiveDbName = dbName;
          logs.push(createSqlLog('info', [`✓ Database changed to '${dbName}'.`]));
        } else {
          databaseRegistry[dbName] = {
            name: dbName,
            description: 'Custom user database',
            tables: {}
          };
          currentActiveDbName = dbName;
          logs.push(createSqlLog('info', [`✓ Database '${dbName}' created & selected.`]));
        }
        continue;
      }

      // 3. CREATE DATABASE <name>
      const createDbMatch = cleanStmt.match(/^CREATE\s+DATABASE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
      if (createDbMatch) {
        const dbName = createDbMatch[1];
        if (!databaseRegistry[dbName]) {
          databaseRegistry[dbName] = {
            name: dbName,
            description: 'Custom database',
            tables: {}
          };
          logs.push(createSqlLog('info', [`✓ Database '${dbName}' created successfully.`]));
        } else {
          logs.push(createSqlLog('info', [`ℹ Database '${dbName}' already exists.`]));
        }
        continue;
      }

      // 4. SHOW TABLES
      if (/^SHOW\s+TABLES/i.test(cleanStmt)) {
        const tbls = Object.keys(getActiveDatabase().tables).map(t => ({
          Tables_in_database: t,
          Rows: getActiveDatabase().tables[t].rows.length,
          Columns: getActiveDatabase().tables[t].columns.length,
        }));
        lastResultTable = tbls;
        const dur = Math.round(performance.now() - stmtStart);
        logs.push(createSqlLog('info', [`📋 SHOW TABLES in '${currentActiveDbName}':`]));
        logs.push(createSqlLog('table', [tbls]));
        const typedCols = inferColumnsFromRows(tbls);
        legacyQueryResults.push({ query: cleanStmt, columns: Object.keys(tbls[0] || {}), rows: tbls, rowCount: tbls.length, executionTimeMs: dur });
        sqlQueryResults.push({
          id: `query_${stmtIndex}`,
          query: cleanStmt,
          columns: typedCols,
          rows: tbls,
          rowCount: tbls.length,
          executionTimeMs: dur,
          status: 'success',
          startedAt
        });
        continue;
      }

      // 5. DESCRIBE / DESC <table>
      const descMatch = cleanStmt.match(/^(?:DESCRIBE|DESC)\s+([a-zA-Z0-9_]+)/i);
      if (descMatch) {
        const tblName = descMatch[1];
        const tbl = getActiveDatabase().tables[tblName];
        if (tbl) {
          const descRows = tbl.columns.map(c => ({
            Field: c.name,
            Type: c.type,
            Key: c.isPrimary ? 'PRI' : (c.isForeign ? 'MUL' : ''),
            Null: c.nullable ? 'YES' : 'NO',
            Default: c.defaultVal !== undefined ? String(c.defaultVal) : 'NULL',
          }));
          lastResultTable = descRows;
          const dur = Math.round(performance.now() - stmtStart);
          logs.push(createSqlLog('info', [`📋 Schema for table '${tblName}':`]));
          logs.push(createSqlLog('table', [descRows]));
          const typedCols = inferColumnsFromRows(descRows);
          legacyQueryResults.push({ query: cleanStmt, columns: Object.keys(descRows[0] || {}), rows: descRows, rowCount: descRows.length, executionTimeMs: dur });
          sqlQueryResults.push({
            id: `query_${stmtIndex}`,
            query: cleanStmt,
            columns: typedCols,
            rows: descRows,
            rowCount: descRows.length,
            executionTimeMs: dur,
            status: 'success',
            startedAt
          });
        } else {
          logs.push(createSqlLog('error', [`Table '${tblName}' not found in database '${currentActiveDbName}'.`]));
        }
        continue;
      }

      // 6. CREATE TABLE <table> (...)
      const createTableMatch = cleanStmt.match(/^CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*)\)/i);
      if (createTableMatch) {
        const tblName = createTableMatch[1];
        const colDefs = createTableMatch[2].split(',').map(c => c.trim()).filter(Boolean);
        const parsedCols = colDefs.map(def => {
          const parts = def.split(/\s+/);
          return {
            name: parts[0],
            type: parts[1] || 'VARCHAR(255)',
            isPrimary: /PRIMARY\s+KEY/i.test(def),
          };
        });

        getActiveDatabase().tables[tblName] = {
          name: tblName,
          columns: parsedCols,
          rowCount: 0,
          rows: [],
        };
        logs.push(createSqlLog('info', [`✓ Table '${tblName}' created successfully in '${currentActiveDbName}'.`]));
        continue;
      }

      // 7. DROP TABLE [IF EXISTS] <table>
      const dropTableMatch = cleanStmt.match(/^DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([a-zA-Z0-9_]+)/i);
      if (dropTableMatch) {
        const tblName = dropTableMatch[1];
        if (getActiveDatabase().tables[tblName]) {
          delete getActiveDatabase().tables[tblName];
          logs.push(createSqlLog('info', [`✓ Table '${tblName}' dropped from '${currentActiveDbName}'.`]));
        } else {
          logs.push(createSqlLog('info', [`ℹ Table '${tblName}' does not exist.`]));
        }
        continue;
      }

      // 8. TRUNCATE TABLE <table>
      const truncateMatch = cleanStmt.match(/^TRUNCATE(?:\s+TABLE)?\s+([a-zA-Z0-9_]+)/i);
      if (truncateMatch) {
        const tblName = truncateMatch[1];
        const tbl = getActiveDatabase().tables[tblName];
        if (tbl) {
          const count = tbl.rows.length;
          tbl.rows = [];
          tbl.rowCount = 0;
          logs.push(createSqlLog('info', [`✓ Table '${tblName}' truncated (${count} rows removed).`]));
        } else {
          logs.push(createSqlLog('error', [`Table '${tblName}' does not exist.`]));
        }
        continue;
      }

      // 9. ALTER TABLE <table> ADD/DROP COLUMN ...
      const alterMatch = cleanStmt.match(/^ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+(ADD|DROP)(?:\s+COLUMN)?\s+([a-zA-Z0-9_]+)(?:\s+([a-zA-Z0-9_()]+))?/i);
      if (alterMatch) {
        const tblName = alterMatch[1];
        const action = alterMatch[2].toUpperCase();
        const colName = alterMatch[3];
        const colType = alterMatch[4] || 'VARCHAR(255)';
        const tbl = getActiveDatabase().tables[tblName];
        if (tbl) {
          if (action === 'ADD') {
            tbl.columns.push({ name: colName, type: colType });
            tbl.rows.forEach(r => { r[colName] = null; });
            logs.push(createSqlLog('info', [`✓ Added column '${colName} ${colType}' to table '${tblName}'.`]));
          } else {
            tbl.columns = tbl.columns.filter(c => c.name !== colName);
            tbl.rows.forEach(r => { delete r[colName]; });
            logs.push(createSqlLog('info', [`✓ Dropped column '${colName}' from table '${tblName}'.`]));
          }
        }
        continue;
      }

      // 10. INSERT INTO <table> (...) VALUES (...)
      const insertMatch = cleanStmt.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)(?:\s*\((.*?)\))?\s+VALUES\s*([\s\S]*)/i);
      if (insertMatch) {
        const tblName = insertMatch[1];
        const colNamesRaw = insertMatch[2];
        const valuesRaw = insertMatch[3];

        let tbl = getActiveDatabase().tables[tblName];
        if (!tbl) {
          tbl = {
            name: tblName,
            columns: [],
            rowCount: 0,
            rows: [],
          };
          getActiveDatabase().tables[tblName] = tbl;
        }

        const specifiedCols = colNamesRaw ? colNamesRaw.split(',').map(c => c.trim()) : null;
        const tuples = valuesRaw.match(/\((.*?)\)/g) || [];
        let insertedCount = 0;

        for (const tuple of tuples) {
          const inner = tuple.slice(1, -1);
          const parts = inner.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map(p => {
            const trimmed = p.trim();
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
            if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
            if (trimmed.toLowerCase() === 'null') return null;
            if (trimmed.toLowerCase() === 'true') return true;
            if (trimmed.toLowerCase() === 'false') return false;
            return trimmed;
          });

          const row: Record<string, any> = {};
          if (specifiedCols) {
            specifiedCols.forEach((col, idx) => {
              row[col] = parts[idx];
            });
          } else if (tbl.columns.length > 0) {
            tbl.columns.forEach((col, idx) => {
              row[col.name] = parts[idx];
            });
          } else {
            parts.forEach((val, idx) => {
              row[`col_${idx + 1}`] = val;
            });
          }

          tbl.rows.push(row);
          tbl.rowCount = tbl.rows.length;
          insertedCount++;
          totalAffectedRowCount++;
        }

        logs.push(createSqlLog('info', [`✓ (${insertedCount} rows affected) Inserted into '${tblName}'.`]));
        continue;
      }

      // 11. UPDATE <table> SET col1 = val1, ... WHERE <cond>
      const updateMatch = cleanStmt.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]*?)(?:\s+WHERE\s+([\s\S]*))?$/i);
      if (updateMatch) {
        const tblName = updateMatch[1];
        const setClause = updateMatch[2].trim();
        const whereClause = updateMatch[3] ? updateMatch[3].trim() : null;

        const tbl = getActiveDatabase().tables[tblName];
        if (!tbl) {
          logs.push(createSqlLog('error', [`Table '${tblName}' does not exist.`]));
          continue;
        }

        const assignments = setClause.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/).map(a => {
          const [col, val] = a.split('=').map(s => s.trim());
          let cleanVal: any = val.replace(/^['"]|['"]$/g, '');
          if (!isNaN(Number(cleanVal)) && cleanVal !== '') cleanVal = Number(cleanVal);
          if (cleanVal === 'null' || cleanVal === 'NULL') cleanVal = null;
          return { col, val: cleanVal };
        });

        let updatedCount = 0;
        for (const row of tbl.rows) {
          if (!whereClause || evaluateWhereCondition(row, whereClause)) {
            for (const { col, val } of assignments) {
              row[col] = val;
            }
            updatedCount++;
            totalAffectedRowCount++;
          }
        }

        logs.push(createSqlLog('info', [`✓ (${updatedCount} rows affected) Updated table '${tblName}'.`]));
        continue;
      }

      // 12. DELETE FROM <table> WHERE <cond>
      const deleteMatch = cleanStmt.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]*))?$/i);
      if (deleteMatch) {
        const tblName = deleteMatch[1];
        const whereClause = deleteMatch[2] ? deleteMatch[2].trim() : null;

        const tbl = getActiveDatabase().tables[tblName];
        if (!tbl) {
          logs.push(createSqlLog('error', [`Table '${tblName}' does not exist.`]));
          continue;
        }

        const originalCount = tbl.rows.length;
        if (!whereClause) {
          tbl.rows = [];
          tbl.rowCount = 0;
          totalAffectedRowCount += originalCount;
          logs.push(createSqlLog('info', [`✓ (${originalCount} rows affected) Deleted all rows from '${tblName}'.`]));
        } else {
          tbl.rows = tbl.rows.filter(row => !evaluateWhereCondition(row, whereClause));
          const deletedCount = originalCount - tbl.rows.length;
          tbl.rowCount = tbl.rows.length;
          totalAffectedRowCount += deletedCount;
          logs.push(createSqlLog('info', [`✓ (${deletedCount} rows affected) Deleted from '${tblName}'.`]));
        }
        continue;
      }

      // 13. EXPLAIN / EXPLAIN ANALYZE <select>
      const explainMatch = cleanStmt.match(/^EXPLAIN(?:\s+ANALYZE)?\s+([\s\S]*)/i);
      if (explainMatch) {
        const innerSelect = explainMatch[1].trim();
        const plan = generateQueryExecutionPlan(innerSelect, getActiveDatabase());
        const planTable = flattenPlanToTable(plan);
        const dur = Math.round(performance.now() - stmtStart);

        lastResultTable = planTable;
        logs.push(createSqlLog('info', [`📋 Query Execution Plan for: ${innerSelect}`]));
        logs.push(createSqlLog('table', [planTable]));

        const typedCols = inferColumnsFromRows(planTable);
        legacyQueryResults.push({ query: cleanStmt, columns: Object.keys(planTable[0] || {}), rows: planTable, rowCount: planTable.length, executionTimeMs: dur });
        sqlQueryResults.push({
          id: `query_${stmtIndex}`,
          query: cleanStmt,
          columns: typedCols,
          rows: planTable,
          rowCount: planTable.length,
          executionTimeMs: dur,
          status: 'success',
          queryPlan: plan,
          startedAt
        });
        continue;
      }

      // 14. SELECT Queries (with JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT)
      if (/^SELECT/i.test(cleanStmt)) {
        const result = executeSelectStatement(cleanStmt, getActiveDatabase());
        lastResultTable = result.rows;
        const dur = Math.round(performance.now() - stmtStart);

        logs.push(createSqlLog('info', [`📊 Query Output (${result.rows.length} rows returned in ${dur}ms):`]));
        logs.push(createSqlLog('table', [result.rows]));

        const typedCols = inferColumnsFromRows(result.rows, result.columns);
        legacyQueryResults.push({
          query: cleanStmt,
          columns: result.columns,
          rows: result.rows,
          rowCount: result.rows.length,
          executionTimeMs: dur,
        });

        sqlQueryResults.push({
          id: `query_${stmtIndex}`,
          query: cleanStmt,
          columns: typedCols,
          rows: result.rows,
          rowCount: result.rows.length,
          executionTimeMs: dur,
          status: 'success',
          startedAt
        });
      }
    }

    return {
      logs,
      result: lastResultTable,
      activeDatabase: currentActiveDbName,
      affectedRows: totalAffectedRowCount,
      queryResults: legacyQueryResults,
      sqlQueryResults,
      executionTimeMs: Math.round(performance.now() - startTime),
      status: 'success',
      rawStdout: JSON.stringify(lastResultTable, null, 2),
    };
  } catch (err: any) {
    logs.push(createSqlLog('error', [`SQL Execution Error: ${err.message || String(err)}`]));
    return {
      logs,
      error: err.message || String(err),
      activeDatabase: currentActiveDbName,
      executionTimeMs: Math.round(performance.now() - startTime),
      status: 'error',
    };
  }
}

/**
 * Generates structured Query Execution Plan for EXPLAIN
 */
function generateQueryExecutionPlan(stmt: string, db: SQLDatabaseSchema): SQLQueryPlanNode {
  const fromMatch = stmt.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
  const primaryTable = fromMatch ? fromMatch[1] : 'dual';
  const tableObj = db.tables[primaryTable];
  const primaryRows = tableObj ? tableObj.rows.length : 1;

  let rootNode: SQLQueryPlanNode = {
    operation: 'Result Projection',
    cost: 1.0,
    estimatedRows: primaryRows,
    details: 'Project selected columns and functions'
  };

  let currentNode = rootNode;

  // Check LIMIT
  const limitMatch = stmt.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    const limitNode: SQLQueryPlanNode = {
      operation: 'Limit',
      target: `LIMIT ${limitMatch[1]}`,
      cost: 0.1,
      estimatedRows: parseInt(limitMatch[1], 10),
      children: []
    };
    currentNode.children = [limitNode];
    currentNode = limitNode;
  }

  // Check ORDER BY
  const orderMatch = stmt.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)/i);
  if (orderMatch) {
    const sortNode: SQLQueryPlanNode = {
      operation: 'Sort',
      target: `ORDER BY ${orderMatch[1]}`,
      cost: Math.round(primaryRows * 1.5 * 10) / 10,
      estimatedRows: primaryRows,
      details: 'Quicksort in-memory key indexing',
      children: []
    };
    currentNode.children = [sortNode];
    currentNode = sortNode;
  }

  // Check GROUP BY
  const groupMatch = stmt.match(/GROUP\s+BY\s+([a-zA-Z0-9_., ]+)/i);
  if (groupMatch) {
    const groupNode: SQLQueryPlanNode = {
      operation: 'Hash Aggregate',
      target: `GROUP BY ${groupMatch[1]}`,
      cost: Math.round(primaryRows * 2.2 * 10) / 10,
      estimatedRows: Math.max(1, Math.round(primaryRows / 2)),
      details: 'Hash-based aggregation accumulator',
      children: []
    };
    currentNode.children = [groupNode];
    currentNode = groupNode;
  }

  // Check JOIN
  const joinMatch = stmt.match(/(INNER|LEFT|RIGHT)?\s*JOIN\s+([a-zA-Z0-9_]+)/i);
  if (joinMatch) {
    const joinTable = joinMatch[2];
    const joinTableObj = db.tables[joinTable];
    const joinRows = joinTableObj ? joinTableObj.rows.length : 1;

    const joinNode: SQLQueryPlanNode = {
      operation: 'Hash Join',
      target: `${primaryTable} ⇄ ${joinTable}`,
      cost: Math.round((primaryRows + joinRows) * 1.8 * 10) / 10,
      estimatedRows: Math.max(primaryRows, joinRows),
      children: [
        {
          operation: 'Seq Scan',
          target: primaryTable,
          cost: Math.round(primaryRows * 0.5 * 10) / 10,
          estimatedRows: primaryRows,
        },
        {
          operation: 'Seq Scan',
          target: joinTable,
          cost: Math.round(joinRows * 0.5 * 10) / 10,
          estimatedRows: joinRows,
        }
      ]
    };
    currentNode.children = [joinNode];
  } else {
    // Single Table Scan
    const whereMatch = stmt.match(/WHERE\s+([\s\S]*?)(?:GROUP|ORDER|LIMIT|$)/i);
    const scanNode: SQLQueryPlanNode = {
      operation: 'Seq Scan',
      target: primaryTable,
      condition: whereMatch ? whereMatch[1].trim() : undefined,
      cost: Math.round(primaryRows * 0.5 * 10) / 10,
      estimatedRows: primaryRows,
      details: whereMatch ? 'Full table scan with predicate evaluation' : 'Full sequential table scan'
    };
    currentNode.children = [scanNode];
  }

  return rootNode;
}

function flattenPlanToTable(node: SQLQueryPlanNode, level = 0): Array<Record<string, any>> {
  const list: Array<Record<string, any>> = [];
  const indent = '  '.repeat(level) + (level > 0 ? '-> ' : '');
  
  list.push({
    Level: level,
    Operation: `${indent}${node.operation}`,
    Target: node.target || '-',
    Condition: node.condition || '-',
    Cost: node.cost ?? 0,
    Est_Rows: node.estimatedRows ?? 1,
    Details: node.details || '-'
  });

  if (node.children) {
    for (const child of node.children) {
      list.push(...flattenPlanToTable(child, level + 1));
    }
  }

  return list;
}

/**
 * Universal In-Memory SELECT Query Evaluator
 */
function executeSelectStatement(stmt: string, db: SQLDatabaseSchema): { columns: string[]; rows: Array<Record<string, any>> } {
  // Extract main table and alias
  const fromMatch = stmt.match(/FROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
  if (!fromMatch) {
    // SELECT without FROM (e.g. SELECT 1+1, VERSION())
    return { columns: ['Result'], rows: [{ Result: 'CloudIDE SQL v2024.1 (In-Memory RDBMS Engine)' }] };
  }

  const primaryTable = fromMatch[1];
  const primaryAlias = fromMatch[2] || primaryTable;

  const tableObj = db.tables[primaryTable];
  if (!tableObj) {
    throw new Error(`Table '${primaryTable}' does not exist in database '${db.name}'.`);
  }

  // Check DISTINCT
  const isDistinct = /SELECT\s+DISTINCT/i.test(stmt);

  // Build working rows
  let dataset: Array<Record<string, any>> = tableObj.rows.map(r => {
    const aliased: Record<string, any> = { ...r };
    for (const k of Object.keys(r)) {
      aliased[`${primaryAlias}.${k}`] = r[k];
      aliased[`${primaryTable}.${k}`] = r[k];
    }
    return aliased;
  });

  // Handle JOINs e.g. INNER JOIN orders o ON u.id = o.user_id
  const joinMatches = [...stmt.matchAll(/(INNER\s+|LEFT\s+|RIGHT\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?\s+ON\s+([^\s]+)\s*=\s*([^\s]+)/gi)];

  for (const match of joinMatches) {
    const joinTable = match[2];
    const joinAlias = match[3] || joinTable;
    const leftKey = match[4];
    const rightKey = match[5];

    const joinTableObj = db.tables[joinTable];
    if (joinTableObj) {
      const joinedDataset: Array<Record<string, any>> = [];

      for (const row of dataset) {
        const valLeft = resolveValue(row, leftKey);
        const matches = joinTableObj.rows.filter(jRow => {
          const valRight = resolveValue(jRow, rightKey.includes('.') ? rightKey.split('.')[1] : rightKey);
          return String(valLeft) === String(valRight);
        });

        if (matches.length > 0) {
          for (const m of matches) {
            const merged = { ...row, ...m };
            for (const k of Object.keys(m)) {
              merged[`${joinAlias}.${k}`] = m[k];
              merged[`${joinTable}.${k}`] = m[k];
            }
            joinedDataset.push(merged);
          }
        }
      }
      dataset = joinedDataset;
    }
  }

  // Handle WHERE clause
  const whereMatch = stmt.match(/WHERE\s+([\s\S]*?)(?:GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|$)/i);
  if (whereMatch) {
    const whereCondition = whereMatch[1].trim();
    dataset = dataset.filter(row => evaluateWhereCondition(row, whereCondition));
  }

  // Handle GROUP BY & Aggregations
  const groupByMatch = stmt.match(/GROUP\s+BY\s+([a-zA-Z0-9_., ]+)(?:\s+HAVING\s+([\s\S]*?))?(?:ORDER\s+BY|LIMIT|$)/i);
  const selectClauseMatch = stmt.match(/SELECT\s+(?:DISTINCT\s+)?([\s\S]*?)\s+FROM/i);
  const selectClause = selectClauseMatch ? selectClauseMatch[1].trim() : '*';

  let finalRows: Array<Record<string, any>> = [];

  if (groupByMatch) {
    const groupCols = groupByMatch[1].split(',').map(c => c.trim());
    const havingCondition = groupByMatch[2] ? groupByMatch[2].trim() : null;
    const groups: Record<string, Array<Record<string, any>>> = {};

    for (const row of dataset) {
      const groupKey = groupCols.map(c => resolveValue(row, c)).join('__');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
    }

    finalRows = Object.values(groups).map(groupRows => {
      return projectColumns(groupRows[0], selectClause, groupRows);
    });

    if (havingCondition) {
      finalRows = finalRows.filter(r => evaluateWhereCondition(r, havingCondition));
    }
  } else {
    // Normal projection
    if (selectClause.includes('COUNT(') || selectClause.includes('SUM(') || selectClause.includes('AVG(') || selectClause.includes('MIN(') || selectClause.includes('MAX(')) {
      finalRows = [projectColumns(dataset[0] || {}, selectClause, dataset)];
    } else {
      finalRows = dataset.map(row => projectColumns(row, selectClause));
    }
  }

  // DISTINCT filtering
  if (isDistinct && finalRows.length > 0) {
    const seen = new Set<string>();
    finalRows = finalRows.filter(r => {
      const serialized = JSON.stringify(r);
      if (seen.has(serialized)) return false;
      seen.add(serialized);
      return true;
    });
  }

  // Handle ORDER BY
  const orderByMatch = stmt.match(/ORDER\s+BY\s+([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?/i);
  if (orderByMatch) {
    const sortCol = orderByMatch[1];
    const isDesc = (orderByMatch[2] || 'ASC').toUpperCase() === 'DESC';

    finalRows.sort((a, b) => {
      const valA = a[sortCol] !== undefined ? a[sortCol] : resolveValue(a, sortCol);
      const valB = b[sortCol] !== undefined ? b[sortCol] : resolveValue(b, sortCol);
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });
  }

  // Handle LIMIT / OFFSET
  const limitMatch = stmt.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1], 10);
    const offset = limitMatch[2] ? parseInt(limitMatch[2], 10) : 0;
    finalRows = finalRows.slice(offset, offset + limit);
  }

  const columns = Object.keys(finalRows[0] || {});
  return { columns, rows: finalRows };
}

function resolveValue(row: Record<string, any>, key: string): any {
  if (row[key] !== undefined) return row[key];
  if (key.includes('.')) {
    const colOnly = key.split('.')[1];
    if (row[colOnly] !== undefined) return row[colOnly];
  }
  return undefined;
}

function evaluateWhereCondition(row: Record<string, any>, cond: string): boolean {
  if (cond.includes(' OR ')) {
    return cond.split(' OR ').some(part => evaluateWhereCondition(row, part.trim()));
  }
  if (cond.includes(' AND ')) {
    return cond.split(' AND ').every(part => evaluateWhereCondition(row, part.trim()));
  }

  // IS NULL / IS NOT NULL
  const nullMatch = cond.match(/([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL/i);
  if (nullMatch) {
    const field = nullMatch[1];
    const isNot = Boolean(nullMatch[2]);
    const val = resolveValue(row, field);
    const isNull = val === null || val === undefined;
    return isNot ? !isNull : isNull;
  }

  // IN ('...', '...')
  const inMatch = cond.match(/([a-zA-Z0-9_.]+)\s+IN\s*\((.*?)\)/i);
  if (inMatch) {
    const field = inMatch[1];
    const rawList = inMatch[2].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    const val = resolveValue(row, field);
    return rawList.includes(String(val));
  }

  // LIKE '%abc%'
  const likeMatch = cond.match(/([a-zA-Z0-9_.]+)\s+LIKE\s+['"](.*?)['"]/i);
  if (likeMatch) {
    const field = likeMatch[1];
    const pattern = likeMatch[2].replace(/%/g, '.*');
    const regex = new RegExp(pattern, 'i');
    const val = resolveValue(row, field);
    return regex.test(String(val || ''));
  }

  // Greater than / Less than / Equals / Not equals
  const compMatch = cond.match(/([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.*)/);
  if (compMatch) {
    const field = compMatch[1];
    const op = compMatch[2];
    let expected: any = compMatch[3].trim().replace(/^['"]|['"]$/g, '');
    if (!isNaN(Number(expected)) && expected !== '') expected = Number(expected);

    const actual = resolveValue(row, field);

    switch (op) {
      case '=': return String(actual) === String(expected);
      case '!=':
      case '<>': return String(actual) !== String(expected);
      case '>': return Number(actual) > Number(expected);
      case '<': return Number(actual) < Number(expected);
      case '>=': return Number(actual) >= Number(expected);
      case '<=': return Number(actual) <= Number(expected);
    }
  }

  return true;
}

function projectColumns(
  row: Record<string, any>, 
  selectClause: string, 
  groupRows?: Array<Record<string, any>>
): Record<string, any> {
  if (selectClause.trim() === '*') {
    const clean: Record<string, any> = {};
    for (const k of Object.keys(row)) {
      if (!k.includes('.')) {
        clean[k] = row[k];
      }
    }
    return clean;
  }

  const projected: Record<string, any> = {};
  const colExpressions = selectClause.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/);

  for (const expr of colExpressions) {
    const aliasMatch = expr.match(/(.*?)\s+(?:AS\s+)?([a-zA-Z0-9_]+)$/i);
    const rawExpr = aliasMatch ? aliasMatch[1].trim() : expr.trim();
    const alias = aliasMatch ? aliasMatch[2].trim() : rawExpr;

    // COUNT(*)
    if (/COUNT\(\*\)/i.test(rawExpr)) {
      projected[alias] = groupRows ? groupRows.length : 1;
      continue;
    }

    // SUM(col)
    const sumMatch = rawExpr.match(/SUM\(([a-zA-Z0-9_.]+)\)/i);
    if (sumMatch && groupRows) {
      const col = sumMatch[1];
      const sum = groupRows.reduce((a, r) => a + (Number(resolveValue(r, col)) || 0), 0);
      projected[alias] = Number(sum.toFixed(2));
      continue;
    }

    // AVG(col)
    const avgMatch = rawExpr.match(/AVG\(([a-zA-Z0-9_.]+)\)/i);
    if (avgMatch && groupRows) {
      const col = avgMatch[1];
      const sum = groupRows.reduce((a, r) => a + (Number(resolveValue(r, col)) || 0), 0);
      projected[alias] = Number((sum / (groupRows.length || 1)).toFixed(2));
      continue;
    }

    // MIN(col)
    const minMatch = rawExpr.match(/MIN\(([a-zA-Z0-9_.]+)\)/i);
    if (minMatch && groupRows) {
      const col = minMatch[1];
      const vals = groupRows.map(r => Number(resolveValue(r, col))).filter(v => !isNaN(v));
      projected[alias] = Math.min(...vals);
      continue;
    }

    // MAX(col)
    const maxMatch = rawExpr.match(/MAX\(([a-zA-Z0-9_.]+)\)/i);
    if (maxMatch && groupRows) {
      const col = maxMatch[1];
      const vals = groupRows.map(r => Number(resolveValue(r, col))).filter(v => !isNaN(v));
      projected[alias] = Math.max(...vals);
      continue;
    }

    // UPPER(col)
    const upperMatch = rawExpr.match(/UPPER\(([a-zA-Z0-9_.]+)\)/i);
    if (upperMatch) {
      const col = upperMatch[1];
      projected[alias] = String(resolveValue(row, col) || '').toUpperCase();
      continue;
    }

    // LOWER(col)
    const lowerMatch = rawExpr.match(/LOWER\(([a-zA-Z0-9_.]+)\)/i);
    if (lowerMatch) {
      const col = lowerMatch[1];
      projected[alias] = String(resolveValue(row, col) || '').toLowerCase();
      continue;
    }

    // LENGTH(col)
    const lengthMatch = rawExpr.match(/LENGTH\(([a-zA-Z0-9_.]+)\)/i);
    if (lengthMatch) {
      const col = lengthMatch[1];
      projected[alias] = String(resolveValue(row, col) || '').length;
      continue;
    }

    // ROUND(col, dec)
    const roundMatch = rawExpr.match(/ROUND\(([a-zA-Z0-9_.]+)(?:,\s*(\d+))?\)/i);
    if (roundMatch) {
      const col = roundMatch[1];
      const dec = roundMatch[2] ? parseInt(roundMatch[2], 10) : 0;
      const val = Number(resolveValue(row, col)) || 0;
      projected[alias] = Number(val.toFixed(dec));
      continue;
    }

    // Regular Column
    projected[alias] = resolveValue(row, rawExpr);
  }

  return projected;
}
