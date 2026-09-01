import crypto from 'crypto';

export interface Transaction {
  serialNumber: string;
  fromAddress: string;
  toAddress: string;
  timestamp: number;
}

export class Block {
  public nonce: number;
  public hash: string;

  constructor(
    public index: number,
    public timestamp: number,
    public data: Transaction[],
    public previousHash: string
  ) {
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    const dataToHash = this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.nonce;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  mineBlock(difficulty: number) {
    const expectedZeros = Array(difficulty + 1).join('0');

    while (this.hash.substring(0, difficulty) !== expectedZeros) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    console.log(`Block mined: ${this.hash}`);
  }
}