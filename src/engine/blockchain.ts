import crypto from 'crypto';
import { Block, Transaction } from '../engine/block.js';
import { db } from '../db.js';


interface DbBlock {
  index: number;
  timestamp: number;
  previousHash: string;
  nonce: number;
  hash: string;
}

interface DbTransaction {
  id: number;
  serialNumber: string;
  fromAddress: string;
  toAddress: string;
  timestamp: number;
  status: string;
  blockIndex: number | null;
}


export class Blockchain {
  public difficulty: number;

  constructor() {
    this.difficulty = process.env.NODE_ENV === 'test' ? 1 : 3;
    this.initializeGenesisBlock();
  }

  private initializeGenesisBlock() {
    const row = db.prepare('SELECT * FROM blocks WHERE "index" = 0').get() as DbBlock | undefined;
    
    if (!row) {
      const genesisBlock = new Block(0, 1720000000000, [], '0');
      
      db.prepare(`
        INSERT INTO blocks ("index", timestamp, previousHash, nonce, hash)
        VALUES (@index, @timestamp, @previousHash, @nonce, @hash)
      `).run({
        index: genesisBlock.index,
        timestamp: genesisBlock.timestamp,
        previousHash: genesisBlock.previousHash,
        nonce: genesisBlock.nonce,
        hash: genesisBlock.hash
      });
      
    }
  }

  getLatestBlock(): DbBlock {
    const blockRow = db.prepare('SELECT * FROM blocks ORDER BY "index" DESC LIMIT 1').get() as DbBlock;
    return blockRow;
  }

  addTransaction(transaction: Transaction) {
    
    const stmt = db.prepare(`
      INSERT INTO transactions (serialNumber, fromAddress, toAddress, timestamp, status)
      VALUES (@serialNumber, @fromAddress, @toAddress, @timestamp, 'PENDING')
    `);
    
    stmt.run({
      serialNumber: transaction.serialNumber,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      timestamp: transaction.timestamp
    });
  }

  minePendingTransactions() {
    const rawPendingTxs = db.prepare("SELECT * FROM transactions WHERE status = 'PENDING'").all() as DbTransaction[];
    
    if (rawPendingTxs.length === 0) {
      throw new Error("No pending transactions to mine.");
    }

    const cleanTxs: Transaction[] = rawPendingTxs.map(tx => ({
      serialNumber: tx.serialNumber,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      timestamp: tx.timestamp
    }));

    const previousBlock = this.getLatestBlock();
    const newIndex = previousBlock.index + 1;
    
    const newBlock = new Block(newIndex, Date.now(), cleanTxs, previousBlock.hash);
    
    newBlock.mineBlock(this.difficulty);

    const insertBlock = db.prepare(`
      INSERT INTO blocks ("index", timestamp, previousHash, nonce, hash)
      VALUES (@index, @timestamp, @previousHash, @nonce, @hash)
    `);

    const updateTransactions = db.prepare(`
      UPDATE transactions SET status = 'MINED', blockIndex = @blockIndex WHERE status = 'PENDING'
    `);

    const saveToDatabase = db.transaction(() => {
      insertBlock.run({
        index: newBlock.index,
        timestamp: newBlock.timestamp,
        previousHash: newBlock.previousHash,
        nonce: newBlock.nonce,
        hash: newBlock.hash
      });
      
      updateTransactions.run({ blockIndex: newBlock.index });
    });

    saveToDatabase();
  }

  isChainValid(): boolean {
    const blocks = db.prepare('SELECT * FROM blocks ORDER BY "index" ASC').all() as DbBlock[];

    for (let i = 1; i < blocks.length; i++) {
      const currentDbBlock = blocks[i];
      const previousDbBlock = blocks[i - 1];

      if (currentDbBlock.previousHash !== previousDbBlock.hash) {
        console.error(`Chain broken at block ${currentDbBlock.index}: previousHash does not match.`);
        return false;
      }

      const rawTxs = db.prepare('SELECT * FROM transactions WHERE blockIndex = @blockIndex').all({
        blockIndex: currentDbBlock.index
      }) as DbTransaction[];
      
      const cleanTxs: Transaction[] = rawTxs.map(tx => ({
        serialNumber: tx.serialNumber,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        timestamp: tx.timestamp
      }));

      const dataToHash = currentDbBlock.index + currentDbBlock.timestamp + JSON.stringify(cleanTxs) + currentDbBlock.previousHash + currentDbBlock.nonce;
      const recalculatedHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

      if (currentDbBlock.hash !== recalculatedHash) {
        console.error(`Tampering detected at block ${currentDbBlock.index}: Hashes do not match!`);
        return false;
      }
    }

    return true; 
  }
}