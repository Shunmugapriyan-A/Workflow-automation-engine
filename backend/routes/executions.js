const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('../controllers/execution');

// List all logs across all executions (for Global Logs page)
router.get('/global-logs', controller.getAllLogs);

// List all executions (for Audit Logs page)
router.get('/', async (req, res) => {
    try {
        const prisma = require('../prisma');
        const executions = await prisma.execution.findMany({
            orderBy: { started_at: 'desc' },
            include: {
                workflow: { select: { name: true } },
                execution_logs: {
                    select: { id: true, status: true, step_name: true },
                    orderBy: { started_at: 'asc' }
                }
            }
        });
        res.json(executions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single execution with all logs
router.get('/:id', controller.getExecution);

// Get only the logs for an execution (useful for direct SQL-style queries)
router.get('/:id/logs', controller.getExecutionLogs);

// Execution lifecycle actions
router.post('/:id/cancel', controller.cancelExecution);
router.post('/:id/retry', controller.retryExecution);
router.post('/:id/approve', controller.approveExecution);

module.exports = router;
