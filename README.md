# Luxury Goods Blockchain ⌚👜

## Overview
This project is a Node.js-based REST API that implements a Proof-of-Work (PoW) blockchain to prevent the counterfeiting of luxury goods (e.g., watches, handbags). By issuing digital passports and registering every ownership change in an immutable ledger, the system ensures secure, verifiable product tracking. 

The architecture is designed to demonstrate core backend concepts, including distributed state validation, cryptographic integrity, and robust MVC structuring.

## Core Features
* **Strict State Validation:** Prevents "double-spending" by locking pending transactions and cryptographically verifying current ownership before permitting asset transfers.
* **Proof-of-Work Mining:** Utilizes Node.js native `crypto` module for dynamic hashing loops. The mining difficulty is highly configurable via environment variables.
* **Persistent Storage:** Integrates `better-sqlite3` to permanently store blocks and transactions across server restarts.
* **Advanced Error Handling:** Features custom Express middleware that intercepts state failures and formats errors with accurate HTTP status codes (400, 403, 404, 500).
* **Automated Testing:** Comprehensive Vitest and Supertest coverage for engine logic, database integrity, tampering detection, and API endpoint verification.

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
\`\`\`bash
npm install
\`\`\`

### 2. Environment Setup
Create a \`.env\` file in the root directory to configure the Proof-of-Work difficulty:
\`\`\`env
POW_DIFFICULTY=3
\`\`\`
*(Note: A higher number increases the mining time exponentially).*

### 3. Running the Server
Start the development server (runs on port 3000):
\`\`\`bash
npm run start
\`\`\`

### 4. Running the Tests
Execute the automated test suite to verify engine and API integrity:
\`\`\`bash
npm run test
\`\`\`

---

## 📡 API Endpoints

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| **GET** | `/api/chain` | Retrieves the complete immutable ledger (all mined blocks). |
| **POST** | `/api/transactions` | Validates ownership state and adds a new transfer to the pending pool. |
| **POST** | `/api/mine` | Executes the PoW algorithm, locking pending transactions into a new block. |
| **GET** | `/api/verify/:id` | Validates chain integrity and returns a specific item's complete chronological history. |

### Example Payload (`POST /api/transactions`)
\`\`\`json
{
  "serialNumber": "ROLEX-123",
  "fromAddress": "Alice",
  "toAddress": "Bob",
  "timestamp": 1720000500000
}
\`\`\`

---

## 🏗️ Project Architecture
The application follows a strict Separation of Concerns (SoC) methodology:
* **`/src/engine`**: Contains the core blockchain logic (`Block` and `Blockchain` classes), completely independent of the web layer.
* **`/src/tests`**: Contains all unit and integration tests.
* **`db.ts`**: Manages the SQLite database connection and table initialization.
* **`app.ts`**: The Express application, containing route controllers and custom error-handling middleware.
* **`server.ts`**: The entry point that boots up the server and loads environment variables.