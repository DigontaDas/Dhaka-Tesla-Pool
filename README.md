# Oi Tesla (ওই টেসলা) — Root Gateway

The entire Oi Tesla application is located in the [`oi-tesla/`](./oi-tesla) directory.

### Quick Start:
```bash
cd oi-tesla
docker compose up --build
```

Or run backend and frontend locally:
```bash
# Terminal 1: Backend
cd oi-tesla/backend
npm install
npm test
npm run dev

# Terminal 2: Frontend
cd oi-tesla/frontend
npm install
npm run dev
```

Visit [`http://localhost:3000`](http://localhost:3000).

For full architecture diagrams, ERD, fare model, concurrency handling, and test results, please refer to:
👉 **[Read the Full Documentation in oi-tesla/README.md](./oi-tesla/README.md)**
