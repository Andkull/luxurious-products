import Database from 'better-sqlite3';

const dbName = process.env.NODE_ENV === 'test' ? ':memory:' : 'blockchain.db';
export const db = new Database(dbName);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    "index" INTEGER PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    previousHash TEXT NOT NULL,
    nonce INTEGER NOT NULL,
    hash TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serialNumber TEXT NOT NULL,
    fromAddress TEXT NOT NULL,
    toAddress TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING', 
    blockIndex INTEGER,
    FOREIGN KEY (blockIndex) REFERENCES blocks("index")
  )
`);

console.log('Database initialized and tables verified.');