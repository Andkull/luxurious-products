import { describe, it, expect } from 'vitest';
import { Block } from '../engine/block.js';

describe('Block Class', () => {
  it('calculateHash() should return a 64-character SHA-256 hash', () => {
    const testBlock = new Block(1, 123456789, [], '0');
    
    const hash = testBlock.calculateHash();

    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
  });

  it('mineBlock() should create a hash starting with the correct number of zeros', () => {
  const testBlock = new Block(1, 123456789, [], '0');
  const difficulty = 2;

  testBlock.mineBlock(difficulty);

  const expectedZeros = Array(difficulty + 1).join('0');
  expect(testBlock.hash.substring(0, difficulty)).toBe(expectedZeros);
});

});