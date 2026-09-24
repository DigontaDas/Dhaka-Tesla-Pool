# Oi Tesla (ওই টেসলা) — Root Gateway

[![Walkthrough Video](https://img.shields.io/badge/Loom_Walkthrough-Watch_Video_(6_Min)-ff5a5f?style=for-the-badge&logo=loom&logoColor=white)](#-6-minute-video-walkthrough)
[![Tests Passing](https://img.shields.io/badge/Tests-23_Passed-3ecf8e?style=for-the-badge&logo=vitest&logoColor=white)](#)
[![Docker Ready](https://img.shields.io/badge/Docker_Compose-Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)](#)

---

## 🎥 6-Minute Video Walkthrough
> **Watch the full engineering architecture and live product tour:**  
> 🔗 **[Click Here to Watch the Loom Demo Video](https://www.loom.com/share/YOUR_LOOM_ID_HERE)** *(Replace with your recorded Loom/YouTube link)*
>
> - **0:00 - 1:00**: Problem space, Dhaka commuters, and the grassroots electric "Tesla" trike idea.
> - **1:00 - 3:00**: Architecture, ERD, integer Poysha ledger, atomic seat mutex, and key trade-offs.
> - **3:00 - 6:00**: Live product tour (Nusrat's booking, Pilot Jashim's 100% Bangla cockpit, 3-seat concurrency edge case, and 23 passing tests).

---

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
