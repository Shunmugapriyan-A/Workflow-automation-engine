const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const workflowRoutes = require('./routes/workflows');
const stepRoutes = require('./routes/steps');
const ruleRoutes = require('./routes/rules');
const executionRoutes = require('./routes/executions');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/workflows', workflowRoutes);
app.use('/workflows/:workflow_id/steps', stepRoutes);
app.use('/steps', stepRoutes);
app.use('/steps/:step_id/rules', ruleRoutes);
app.use('/rules', ruleRoutes);
app.use('/executions', executionRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Workflow Engine API is running smoothly!", status: "OK", timestamp: new Date() });
});

// Global Error Handler for DB connections
app.use((err, req, res, next) => {
    console.error(err);
    if (err.code && err.code.startsWith('P')) {
        return res.status(503).json({
            error: "Database Connection Error",
            message: "Failed to authenticate or connect to the PostgreSQL database.",
            details: err.message
        });
    }
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

// Test DB Connection before listening
prisma.$connect()
    .then(() => {
        console.log('\n✅ Successfully connected to PostgreSQL database!');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('\n❌ CRITICAL: Failed to connect to the database. Error details below:');
        console.error(error.message);
        console.error('\nEnsure PostgreSQL is running and credentials are correct.');
        // Don't exit process; allow server to start for API error handling tests
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} (Database connection failed)`);
        });
    });
