import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { db } from '../db.js';

describe('Express API Routes & Middleware', () => {

  it('GET /api/chain should return 200 and the current ledger', async () => {
    const res = await request(app).get('/api/chain');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1); 
  });

  it('POST /api/mine should return 400 Bad Request if there are no pending transactions', async () => {
    const res = await request(app).post('/api/mine');
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No pending transactions');
  });

  it('POST /api/transactions should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ serialNumber: 'ROLEX-API-1' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required');
  });

  it('POST /api/transactions should return 201 when adding a valid transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        serialNumber: 'ROLEX-API-1',
        fromAddress: 'Manufacturer',
        toAddress: 'Alice',
        timestamp: Date.now()
      });
    
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('successfully added');
  });

  it('POST /api/mine should return 200 and successfully mine the block', async () => {
    const res = await request(app).post('/api/mine');
    
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Block mined successfully');
    expect(res.body.block).toBeDefined();
  });

  it('POST /api/transactions should return 403 Forbidden for state validation failure', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        serialNumber: 'ROLEX-API-1',
        fromAddress: 'Bob',
        toAddress: 'Charlie',
        timestamp: Date.now()
      });
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('State Validation Failed');
  });

  it('GET /api/verify/:id should return 200, authenticity, and history for a valid item', async () => {
    const res = await request(app).get('/api/verify/ROLEX-API-1');
    
    expect(res.status).toBe(200);
    expect(res.body.serialNumber).toBe('ROLEX-API-1');
    expect(res.body.isAuthentic).toBe(true);
    expect(res.body.currentOwner).toBe('Alice');
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('GET /api/verify/:id should return isAuthentic: false if the database was tampered with', async () => {
    db.prepare(`
      UPDATE transactions 
      SET toAddress = 'Bob' 
      WHERE serialNumber = 'ROLEX-API-1' AND status = 'MINED'
    `).run();

    const res = await request(app).get('/api/verify/ROLEX-API-1');
    
    expect(res.status).toBe(200);
    
    expect(res.body.isAuthentic).toBe(false);
  });

  it('GET /api/verify/:id should return 404 Not Found for a non-existent item', async () => {
    const res = await request(app).get('/api/verify/GHOST-BAG');
    
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Not found');
  });

});