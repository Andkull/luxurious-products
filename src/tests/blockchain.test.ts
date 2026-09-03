import { describe, it, expect, beforeAll } from 'vitest';
import { Blockchain } from '../engine/blockchain.js';
import { db } from '../db.js';

interface DbTransactionRow {
  id: number;
  serialNumber: string;
  fromAddress: string;
  toAddress: string;
  timestamp: number;
  status: string;
  blockIndex: number | null;
}

describe('Blockchain Class with SQLite', () => {
  let luxuryChain: Blockchain;

  beforeAll(() => {
    luxuryChain = new Blockchain();
  });

  it('should initialize with a Genesis block in SQLite', () => {
    const latestBlock = luxuryChain.getLatestBlock();
    
    expect(latestBlock).toBeDefined();
    expect(latestBlock.index).toBe(0);
    expect(latestBlock.previousHash).toBe('0');
  });

  it('addTransaction() should save a transaction to SQLite with PENDING status', () => {
    luxuryChain.addTransaction({
      serialNumber: 'ROLEX-123',
      fromAddress: 'Manufacturer',
      toAddress: 'Alice',
      timestamp: Date.now()
    });

    const pendingTx = db.prepare("SELECT * FROM transactions WHERE status = 'PENDING'").get() as DbTransactionRow;
    
    expect(pendingTx).toBeDefined();
    expect(pendingTx.serialNumber).toBe('ROLEX-123');
    expect(pendingTx.fromAddress).toBe('Manufacturer');
    expect(pendingTx.status).toBe('PENDING');
  });

  it('minePendingTransactions() should mine a block and update transaction status to MINED', () => {
    luxuryChain.minePendingTransactions();

    const latestBlock = luxuryChain.getLatestBlock();
    
    expect(latestBlock.index).toBe(1);

    const minedTx = db.prepare("SELECT * FROM transactions WHERE serialNumber = 'ROLEX-123'").get() as DbTransactionRow;
    
    expect(minedTx.status).toBe('MINED');
    expect(minedTx.blockIndex).toBe(1); 
  });

  it('isChainValid() should return true for an untampered chain', () => {
    const isValid = luxuryChain.isChainValid();
    expect(isValid).toBe(true);
  });
});