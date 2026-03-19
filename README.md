# Full Stack Workflow Automation Engine

A powerful, dynamic workflow automation engine built with Node.js, Express, React, and PostgreSQL. It features a fully-fledged Rule Engine to evaluate incoming data and route tasks automatically, handling tasks, approvals, and notifications dynamically.

## Prerequisites
- **Node.js**: v18+
- **PostgreSQL**: A running instance (You can use the provided `docker-compose.yml`)

## 🚀 Setup Instructions

### 1. Start the Database
If you have Docker installed, you can start the required PostgreSQL instance immediately:
```bash
docker-compose up -d
```
Alternatively, ensure you have a local PostgreSQL DB named `workflow_engine` with `workflow_user` and password `workflow_password`.

### 2. Install Dependencies & Run Database Migrations
```bash
# Setup Backend
cd backend
npm install
npx prisma generate
npx prisma db push

# Seed the db with the Sample Workflow
node seed.js

# Setup Frontend
cd ../frontend
npm install
```

### 3. Start the Application
You can run both front and backend in separate terminals:

**Start Backend:**
```bash
cd backend
npm run dev
```
(Server starts on `http://localhost:5000`)

**Start Frontend:**
```bash
cd frontend
npm run dev
```
(App starts on `http://localhost:5173`)


## 📖 Example API Usage

1. **Create Workflow**
```bash
curl -X POST http://localhost:5000/workflows \
-H "Content-Type: application/json" \
-d '{"name": "Leave Approval", "input_schema": {"days": {"type": "number", "required": true}}}'
```

2. **Add Step**
```bash
curl -X POST http://localhost:5000/workflows/<WORKFLOW_ID>/steps \
-H "Content-Type: application/json" \
-d '{"name": "Manager Review", "step_type": "approval", "order": 1, "metadata": {}}'
```

3. **Start Execution**
```bash
curl -X POST http://localhost:5000/workflows/<WORKFLOW_ID>/execute \
-H "Content-Type: application/json" \
-d '{"days": 4}'
```

## ⚙️ Example Workflow Execution Scenario (Expense Approval)
1. Open the **Frontend App** at `http://localhost:5173`.
2. Ensure you have run `node seed.js` in the backend to populate the expected **Expense Approval Workflow**.
3. In the UI, click on the **Run (Play)** button next to the Expense Approval workflow.
4. An Input form appears requiring: `amount`, `country`, `department`, `priority`.
5. Enter: `amount: 150`, `country: US`, `priority: High`.
6. Click **Start Execution**.
7. The Execution Page loads and displays an **Action Required** UI since step 1 (Manager Approval) pauses for approval.
8. Validate logs indicating Step 1 rule was triggered. Click **Approve**.
9. The workflow resumes and routes immediately to **Finance Notification** because it matched `amount > 100 && country == 'US' && priority == 'High'`.
10. The frontend polls live; wait ~1s and see the execution mark itself as **Completed**!

Enjoy dynamic routing rules evaluating your live data!
