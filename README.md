# 🚀 Workflow Automation Engine

A **dynamic, rule-driven workflow automation engine** that allows users to design, execute, and monitor workflows with support for conditional branching, approvals, and real-time execution tracking.

---

## 📌 Overview

This project implements a **generic workflow engine** capable of handling multiple business use cases such as:

* Expense Approval
* Leave Management
* Custom Process Automation

Unlike static systems, this engine evaluates **rules at runtime** to determine the next step dynamically.

---

## 🧠 Key Highlights

* 🔄 **Workflow-Agnostic Design** (supports multiple use cases)
* 🧩 Configurable **Steps** (Task, Approval, Notification)
* 🧠 **Rule-Based Decision Engine** (priority-based evaluation)
* 🔀 **Dynamic Conditional Routing**
* ⏸ **Approval System (Pause & Resume Execution)**
* 📊 **Execution Tracking with Logs**
* 🧾 **Audit Logs for Traceability**
* 🗂 **Versioned Workflows**

---

## 🏗 Architecture

```
Frontend (React + Tailwind)
        ↓
Backend (Node.js + Express)
        ↓
Rule Evaluation Engine
        ↓
PostgreSQL (Prisma ORM)
```

---

## ⚙️ Tech Stack

* **Frontend:** React + Vite + TailwindCSS
* **Backend:** Node.js + Express
* **Database:** PostgreSQL (Dockerized)
* **ORM:** Prisma
* **Visualization:** React Flow

---

## 🧪 Example Workflow

### Expense Approval Workflow

```
Manager Approval
   ├── amount > 1000 → Finance Review
   ├── amount <= 1000 → CEO Approval
   └── DEFAULT → Reject
```

---

## 🚀 API Example

### Execute Workflow

**POST** `/executions`

```json
{
  "amount": 1500,
  "country": "US",
  "priority": "High"
}
```

### Expected Flow

```
Manager → Finance → CEO → END
```

---

## 🧾 How It Works

1. User creates a workflow and defines input schema
2. Adds steps (approval/task/notification)
3. Configures rules for transitions
4. Executes workflow with input data
5. Engine evaluates rules dynamically
6. Execution progresses step-by-step
7. Logs are recorded for every step

---

## ⏸ Approval Flow (Core Feature)

* Workflow pauses at approval steps
* User action (Approve/Reject) resumes execution
* Enables **human-in-the-loop automation**

---

## 📊 Execution Tracking

* Each execution is stored with:

  * Status (In Progress / Completed)
  * Execution timeline
  * Step logs
* Enables debugging and auditability

---

## 📸 Screenshots

> *(Add your screenshots here)*

### Workflow Diagram

![Workflow Diagram](./screenshots/diagram.png)

### Execution Screen

![Execution](./screenshots/execution.png)

### Database View

![Database](./screenshots/db.png)

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Shunmugapriyan-A/Workflow-automation-engine.git
cd Workflow-automation-engine
```

---

### 2. Start Database (Docker)

```bash
docker-compose up -d
```

---

### 3. Backend Setup

```bash
cd backend
npm install
node server.js
```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### 5. Access Application

* Frontend → http://localhost:5174
* Backend → http://localhost:5000
* Prisma Studio → http://localhost:5555

---

## 🎯 Design Goals

* Build a **scalable workflow engine**
* Support **dynamic rule evaluation**
* Enable **human interaction in workflows**
* Provide **clear execution visibility**

---

## 💡 Future Improvements

* 🔁 Retry & rollback mechanisms
* 🔔 Real-time notifications
* 👥 Role-based access control
* 📈 Workflow analytics dashboard

---

## 🧠 Key Insight

> This system is **not hardcoded for a single workflow**.
> It is a **generic engine** where workflows, steps, and rules are configurable at runtime.

---

## 👨‍💻 Author

**Priyan**
GitHub: https://github.com/Shunmugapriyan-A

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
