const prisma = require('../prisma');
const { evaluateRules } = require('../rule-engine');

/**
 * Mark an execution as finished — updates status and ended_at
 */
async function finishExecution(id, status, current_step_id) {
    const exec = await prisma.execution.findUnique({ where: { id } });
    const endedAt = new Date();
    const duration = exec ? endedAt - new Date(exec.started_at) : null;
    return prisma.execution.update({
        where: { id },
        data: { status, ended_at: endedAt, duration, current_step_id }
    });
}

/**
 * Core workflow execution engine loop.
 * Processes steps sequentially, evaluates rules, writes per-step logs to ExecutionLog table.
 */
async function processExecution(executionId) {
    const execution = await prisma.execution.findUnique({ where: { id: executionId } });
    if (!execution || execution.status !== 'in_progress') return;

    const pipeline = await prisma.workflow.findUnique({
        where: { id: execution.workflow_id },
        include: { steps: { include: { rules: { orderBy: { priority: 'asc' } } }, orderBy: { order: 'asc' } } }
    });
    if (!pipeline) return;

    let currentStepId = execution.current_step_id;
    let data = typeof execution.data === 'string' ? JSON.parse(execution.data) : execution.data || {};

    // Infinite loop guard
    const visited = new Set();

    while (currentStepId) {
        // Prevent infinite loops
        if (visited.has(currentStepId)) {
            await finishExecution(executionId, 'failed', currentStepId);
            await prisma.executionLog.create({
                data: {
                    execution_id: executionId,
                    step_name: 'System',
                    step_type: 'system',
                    status: 'failed',
                    error_message: 'Infinite loop detected — step visited twice',
                    duration: 0,
                    started_at: new Date(),
                    ended_at: new Date()
                }
            });
            return;
        }
        visited.add(currentStepId);

        const step = pipeline.steps.find(s => s.id === currentStepId);
        if (!step) {
            await finishExecution(executionId, 'failed', currentStepId);
            return;
        }

        // Pause execution for approval steps awaiting human action
        if (step.step_type === 'approval') {
            if (!data[`__approval_${step.id}`]) {
                await prisma.execution.update({
                    where: { id: executionId },
                    data: { current_step_id: step.id, status: 'pending' }
                });
                return;
            }
        }

        const logStartedAt = new Date();

        // Simulate processing time
        try {
            if (step.step_type === 'task') {
                await new Promise(r => setTimeout(r, 800));
            } else if (step.step_type === 'notification') {
                await new Promise(r => setTimeout(r, 400));
            }

            // Evaluate rules
            let nextStepInfo = null;
            let ruleEvalResults = [];

            try {
                if (step.rules && step.rules.length > 0) {
                    // Evaluate each rule and build detailed results
                    for (const rule of step.rules) {
                        try {
                            const result = await evaluateRules([rule], data);
                            ruleEvalResults.push({
                                rule_id: rule.id,
                                condition: rule.condition,
                                priority: rule.priority,
                                next_step_id: rule.next_step_id,
                                matched: !!result
                            });
                            if (result && !nextStepInfo) {
                                nextStepInfo = result;
                            }
                        } catch (ruleErr) {
                            ruleEvalResults.push({
                                rule_id: rule.id,
                                condition: rule.condition,
                                priority: rule.priority,
                                next_step_id: rule.next_step_id,
                                matched: false,
                                error: ruleErr.message
                            });
                        }
                    }
                }
            } catch (err) {
                // Write failed log
                await prisma.executionLog.create({
                    data: {
                        execution_id: executionId,
                        step_name: step.name,
                        step_type: step.step_type,
                        evaluated_rules: JSON.stringify(ruleEvalResults),
                        status: 'failed',
                        error_message: err.message || 'Rule evaluation failed',
                        duration: new Date() - logStartedAt,
                        started_at: logStartedAt,
                        ended_at: new Date()
                    }
                });
                await finishExecution(executionId, 'failed', step.id);
                return;
            }

            const nextStepId = nextStepInfo ? nextStepInfo.next_step_id : null;

            // Write success log to ExecutionLog table
            await prisma.executionLog.create({
                data: {
                    execution_id: executionId,
                    step_name: step.name,
                    step_type: step.step_type,
                    evaluated_rules: JSON.stringify(ruleEvalResults),
                    matched_condition: nextStepInfo ? nextStepInfo.condition : null,
                    selected_next_step: nextStepId || null,
                    status: 'success',
                    duration: new Date() - logStartedAt,
                    started_at: logStartedAt,
                    ended_at: new Date()
                }
            });

            // Update execution current step
            await prisma.execution.update({
                where: { id: executionId },
                data: { current_step_id: nextStepId }
            });

            currentStepId = nextStepId;

        } catch (stepErr) {
            await prisma.executionLog.create({
                data: {
                    execution_id: executionId,
                    step_name: step.name,
                    step_type: step.step_type,
                    evaluated_rules: JSON.stringify([]),
                    status: 'failed',
                    error_message: stepErr.message,
                    duration: new Date() - logStartedAt,
                    started_at: logStartedAt,
                    ended_at: new Date()
                }
            });
            await finishExecution(executionId, 'failed', step.id);
            return;
        }
    }

    // All steps completed
    const endedAt = new Date();
    const duration = endedAt - new Date(execution.started_at);
    await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'completed', ended_at: endedAt, duration, current_step_id: null }
    });
}

// ─────────────────────────────────────────────────────────────
// API Controllers
// ─────────────────────────────────────────────────────────────

exports.startExecution = async (req, res) => {
    try {
        const workflow_id = req.params.id || req.params.workflow_id;
        const data = req.body;

        const workflow = await prisma.workflow.findUnique({ where: { id: workflow_id } });
        if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

        let initialStepId = workflow.start_step_id;
        if (!initialStepId) {
            const firstStep = await prisma.step.findFirst({
                where: { workflow_id },
                orderBy: { order: 'asc' }
            });
            if (!firstStep) return res.status(400).json({ error: 'Cannot start execution: Workflow has no steps' });
            initialStepId = firstStep.id;
        }

        const exec = await prisma.execution.create({
            data: {
                workflow_id,
                workflow_version: workflow.version,
                status: 'in_progress',
                data: JSON.stringify(data),
                current_step_id: initialStepId
            }
        });

        res.status(201).json(exec);

        // Run engine asynchronously so API responds immediately
        processExecution(exec.id).catch(console.error);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getExecution = async (req, res) => {
    try {
        const exec = await prisma.execution.findUnique({
            where: { id: req.params.id },
            include: {
                workflow: { select: { name: true } },
                execution_logs: { orderBy: { started_at: 'asc' } }
            }
        });
        if (!exec) return res.status(404).json({ error: 'Not found' });
        res.json(exec);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getExecutionLogs = async (req, res) => {
    try {
        const logs = await prisma.executionLog.findMany({
            where: { execution_id: req.params.id },
            orderBy: { started_at: 'asc' }
        });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.cancelExecution = async (req, res) => {
    try {
        const exec = await prisma.execution.update({
            where: { id: req.params.id },
            data: { status: 'canceled', ended_at: new Date() }
        });
        res.json(exec);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.retryExecution = async (req, res) => {
    try {
        const exec = await prisma.execution.findUnique({ where: { id: req.params.id } });
        if (!exec || exec.status !== 'failed') {
            return res.status(400).json({ error: 'Only failed executions can be retried' });
        }

        const updated = await prisma.execution.update({
            where: { id: req.params.id },
            data: { status: 'in_progress', retries: exec.retries + 1 }
        });

        res.json(updated);
        processExecution(updated.id).catch(console.error);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.approveExecution = async (req, res) => {
    try {
        const { action } = req.body;
        const exec = await prisma.execution.findUnique({ where: { id: req.params.id } });

        if (!exec || !exec.current_step_id || (exec.status !== 'in_progress' && exec.status !== 'pending')) {
            return res.status(400).json({ error: 'Execution is not waiting for approval' });
        }

        let data = typeof exec.data === 'string' ? JSON.parse(exec.data) : exec.data || {};
        data[`__approval_${exec.current_step_id}`] = action || 'Approved';

        // Log the approval action itself
        await prisma.executionLog.create({
            data: {
                execution_id: exec.id,
                step_name: `Approval: ${action || 'Approved'}`,
                step_type: 'approval_action',
                evaluated_rules: JSON.stringify([]),
                status: 'success',
                approver_id: req.headers['x-user-id'] || 'Manager_001', // Log the approver ID
                duration: 0,
                started_at: new Date(),
                ended_at: new Date()
            }
        });

        await prisma.execution.update({
            where: { id: req.params.id },
            data: { data: JSON.stringify(data), status: 'in_progress' }
        });

        res.json({ message: 'Approval submitted' });
        processExecution(exec.id).catch(console.error);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await prisma.executionLog.findMany({
            include: {
                execution: {
                    include: {
                        workflow: { select: { name: true } }
                    }
                }
            },
            orderBy: { started_at: 'desc' },
            take: 100
        });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
