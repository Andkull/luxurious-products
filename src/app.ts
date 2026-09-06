import express, { Request, Response, NextFunction } from 'express';
import { Blockchain } from './engine/blockchain.js';
import { db } from './db.js';

export const app = express();
app.use(express.json());

const luxuryChain = new Blockchain();

app.get('/api/chain', (req, res, next) => {
  try {
    const blocks = db.prepare('SELECT * FROM blocks ORDER BY "index" ASC').all();
    res.status(200).json(blocks);
  } catch (error) {
    next(error); 
  }
});

app.post('/api/transactions', (req, res, next) => {
  try {
    const { serialNumber, fromAddress, toAddress, timestamp } = req.body;

    if (!serialNumber || !fromAddress || !toAddress || !timestamp) {
      return res.status(400).json({ error: 'Missing required transaction fields.' });
    }

    luxuryChain.addTransaction({
      serialNumber,
      fromAddress,
      toAddress,
      timestamp
    });

    res.status(201).json({ message: 'Transaction successfully added to the pending pool.' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/mine', (req, res, next) => {
  try {
    luxuryChain.minePendingTransactions();

    const minedBlock = luxuryChain.getLatestBlock();

    res.status(200).json({
      message: 'Block mined successfully!',
      block: minedBlock
    });
  } catch (error) {
    next(error); 
  }
});

app.get('/api/verify/:id', (req, res, next) => {
  try {
    const serialNumber = req.params.id;

    const history = db.prepare(`
      SELECT * FROM transactions 
      WHERE serialNumber = @serialNumber 
      ORDER BY timestamp ASC
    `).all({ serialNumber });

    if (history.length === 0) {
      throw new Error(`Not found: No history exists for item ${serialNumber}.`);
    }

    const currentOwner = luxuryChain.getCurrentOwner(serialNumber);

    const isChainAuthentic = luxuryChain.isChainValid();

    res.status(200).json({
      serialNumber,
      isAuthentic: isChainAuthentic,
      currentOwner: currentOwner || 'Pending (Transaction not yet mined)',
      history
    });
  } catch (error) {
    next(error); 
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error]: ${err.message}`);

  if (err.message.includes('State Validation Failed')) {
    return res.status(403).json({ error: err.message });
  }

  if (err.message.includes('No pending transactions')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message.includes('Not found')) {
    return res.status(404).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal Server Error' });
});