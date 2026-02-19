const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data', 'closepilot.db');
let db = null;

function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function prepare(sql) {
  return {
    get(...params) {
      const results = db.exec(sql, params);
      if (!results.length || !results[0].values.length) return undefined;
      const cols = results[0].columns;
      const vals = results[0].values[0];
      const obj = {};
      cols.forEach((c, i) => obj[c] = vals[i]);
      return obj;
    },
    all(...params) {
      const results = db.exec(sql, params);
      if (!results.length) return [];
      const cols = results[0].columns;
      return results[0].values.map(vals => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      });
    },
    run(...params) {
      db.run(sql, params);
      saveDb();
      const lastId = db.exec('SELECT last_insert_rowid()');
      return {
        lastInsertRowid: lastId[0]?.values[0]?.[0] || 0,
        changes: db.getRowsModified()
      };
    }
  };
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const file = fs.readFileSync(dbPath);
    db = new SQL.Database(file);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, firm TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, property TEXT NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, county TEXT, price REAL NOT NULL, status TEXT DEFAULT 'Active', contract_date TEXT, closing_date TEXT, contract_type TEXT, raw_parsed_json TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`,
    `CREATE TABLE IF NOT EXISTS parties (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, role TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, firm TEXT, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS milestones (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, label TEXT NOT NULL, date TEXT NOT NULL, completed INTEGER DEFAULT 0, category TEXT, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, name TEXT NOT NULL, status TEXT DEFAULT 'Pending', file_path TEXT, file_size INTEGER, mime_type TEXT, uploaded_at TEXT, uploaded_by INTEGER, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS contingencies (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, name TEXT NOT NULL, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, email TEXT, phone TEXT, extra_json TEXT, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS document_signatures (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, signer_name TEXT NOT NULL, signer_email TEXT NOT NULL, status TEXT DEFAULT 'pending', signed_at TEXT, ip_address TEXT, token TEXT UNIQUE NOT NULL, signature_data TEXT, FOREIGN KEY (document_id) REFERENCES documents(id))`,
    `CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER, user_id INTEGER, action TEXT NOT NULL, detail TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (transaction_id) REFERENCES transactions(id))`,
    `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER NOT NULL, user_id INTEGER NOT NULL, content TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (transaction_id) REFERENCES transactions(id), FOREIGN KEY (user_id) REFERENCES users(id))`
  ];
  tables.forEach(t => db.run(t));

  // Migration: add columns to documents if missing
  try { db.run('ALTER TABLE documents ADD COLUMN file_path TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE documents ADD COLUMN file_size INTEGER'); } catch(e) {}
  try { db.run('ALTER TABLE documents ADD COLUMN mime_type TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE documents ADD COLUMN uploaded_at TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE documents ADD COLUMN uploaded_by INTEGER'); } catch(e) {}
  try { db.run('ALTER TABLE document_signatures ADD COLUMN signature_data TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE documents ADD COLUMN category TEXT'); } catch(e) {}

  const count = db.exec('SELECT COUNT(*) FROM users');
  const userCount = count[0]?.values[0]?.[0] || 0;

  if (userCount === 0) {
    const hash = bcrypt.hashSync('demo123', 10);
    prepare('INSERT INTO users (email, password_hash, name, firm) VALUES (?,?,?,?)').run('demo@closepilot.ai', hash, 'Chris Eanniello', 'ClosePilot Realty');

    const ins = (q, ...args) => prepare(q).run(...args);

    ins('INSERT INTO transactions (user_id,property,address,city,state,county,price,status,contract_date,closing_date,contract_type) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 1,'252 Shelton St','252 Shelton St','Bridgeport','CT','Fairfield',300000,'Active','2026-01-15','2026-03-15','Purchase');
    ins('INSERT INTO transactions (user_id,property,address,city,state,county,price,status,contract_date,closing_date,contract_type) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 1,'88 Fairfield Ave','88 Fairfield Ave','Hartford','CT','Hartford',425000,'Pending','2026-01-20','2026-03-20','Purchase');
    ins('INSERT INTO transactions (user_id,property,address,city,state,county,price,status,contract_date,closing_date,contract_type) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 1,'15 Maple Dr','15 Maple Dr','Stamford','CT','Fairfield',550000,'Closed','2025-10-01','2025-12-15','Purchase');

    const m = (tid,l,d,c,cat) => prepare('INSERT INTO milestones (transaction_id,label,date,completed,category) VALUES (?,?,?,?,?)').run(tid,l,d,c,cat);
    m(1,'Contract Signed','2026-01-15',1,'Contract'); m(1,'Inspection Period Ends','2026-02-01',1,'Inspection');
    m(1,'Appraisal Due','2026-02-15',0,'Financing'); m(1,'Mortgage Commitment','2026-02-28',0,'Financing');
    m(1,'Final Walkthrough','2026-03-13',0,'Closing'); m(1,'Closing','2026-03-15',0,'Closing');
    m(2,'Contract Signed','2026-01-20',1,'Contract'); m(2,'Inspection Period Ends','2026-02-05',1,'Inspection');
    m(2,'Appraisal Due','2026-02-20',0,'Financing'); m(2,'Mortgage Commitment','2026-03-05',0,'Financing');
    m(2,'Closing','2026-03-20',0,'Closing');
    m(3,'Contract Signed','2025-10-01',1,'Contract'); m(3,'Inspection Period Ends','2025-10-15',1,'Inspection');
    m(3,'Appraisal Due','2025-11-01',1,'Financing'); m(3,'Closing','2025-12-15',1,'Closing');

    const p = (tid,r,n,e,ph,f) => prepare('INSERT INTO parties (transaction_id,role,name,email,phone,firm) VALUES (?,?,?,?,?,?)').run(tid,r,n,e,ph,f);
    p(1,'Buyer','John Smith','john@example.com','203-555-0101',null);
    p(1,'Seller','Jane Doe','jane@example.com','203-555-0102',null);
    p(1,'Listing Agent','Bob Agent','bob@realty.com','203-555-0103','ABC Realty');
    p(2,'Buyer','Alice Johnson','alice@example.com','860-555-0201',null);
    p(2,'Seller','Tom Brown','tom@example.com','860-555-0202',null);
    p(3,'Buyer','Sarah Wilson','sarah@example.com','203-555-0301',null);
    p(3,'Seller','Mike Davis','mike@example.com','203-555-0302',null);

    const d = (tid,n,s) => prepare('INSERT INTO documents (transaction_id,name,status) VALUES (?,?,?)').run(tid,n,s);
    d(1,'Purchase Agreement','Received'); d(1,'Home Inspection Report','Received');
    d(1,'Appraisal Report','Pending'); d(1,'Title Search','Pending'); d(1,'Mortgage Commitment Letter','Pending');
    d(2,'Purchase Agreement','Received'); d(2,'Home Inspection Report','Received'); d(2,'Appraisal Report','Pending');
    d(3,'Purchase Agreement','Received'); d(3,'Closing Disclosure','Received');

    prepare('INSERT INTO contingencies (transaction_id,name) VALUES (?,?)').run(1,'Financing Contingency');
    prepare('INSERT INTO contingencies (transaction_id,name) VALUES (?,?)').run(1,'Appraisal Contingency');
    prepare('INSERT INTO contingencies (transaction_id,name) VALUES (?,?)').run(2,'Financing Contingency');
    prepare('INSERT INTO contingencies (transaction_id,name) VALUES (?,?)').run(2,'Inspection Contingency');

    const v = (tid,t,n,e,ph) => prepare('INSERT INTO vendors (transaction_id,type,name,email,phone) VALUES (?,?,?,?,?)').run(tid,t,n,e,ph);
    v(1,'Inspector','Pro Home Inspections','info@proinspect.com','203-555-1001');
    v(1,'Lender','First National Bank','loans@fnb.com','203-555-1002');
    v(1,'Title Company','Secure Title LLC','close@securetitle.com','203-555-1003');
    v(2,'Inspector','Elite Inspections','team@eliteinspect.com','860-555-2001');
    v(2,'Lender','Hartford Mortgage Co','apply@hartfordmtg.com','860-555-2002');
    v(3,'Title Company','Stamford Title Group','info@stamfordtitle.com','203-555-3001');

    console.log('Seeded demo data');
  }

  return db;
}

module.exports = { initDb, prepare, getDb: () => db };
