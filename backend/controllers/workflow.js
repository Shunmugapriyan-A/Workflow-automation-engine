const prisma = require('../prisma');

exports.createWorkflow = async (req, res) => {
    try {
        const { name, input_schema, start_step_id } = req.body;
        const workflow = await prisma.workflow.create({
            data: { name, input_schema: JSON.stringify(input_schema || {}), start_step_id },
        });
        res.status(201).json(workflow);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getWorkflows = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
        const workflows = await prisma.workflow.findMany({
            where,
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: { _count: { select: { steps: true } } }
        });
        const total = await prisma.workflow.count({ where });

        workflows.forEach(w => {
            try { w.input_schema = JSON.parse(w.input_schema); } catch(e){}
        });

        res.json({ workflows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getWorkflow = async (req, res) => {
    try {
        const workflow = await prisma.workflow.findUnique({
            where: { id: req.params.id },
            include: { steps: { include: { rules: { orderBy: { priority: 'asc' } } }, orderBy: { order: 'asc' } } }
        });
        if (!workflow) return res.status(404).json({ error: "Not found" });
        try { workflow.input_schema = JSON.parse(workflow.input_schema); } catch(e){}
        workflow.steps.forEach(s => {
            try { if (s.metadata) s.metadata = JSON.parse(s.metadata); } catch(e){}
        });
        res.json(workflow);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateWorkflow = async (req, res) => {
    try {
        const { name, input_schema, start_step_id, is_active } = req.body;
        const current = await prisma.workflow.findUnique({ where: { id: req.params.id } });
        if (!current) return res.status(404).json({ error: "Not found" });
        
        const workflow = await prisma.workflow.update({
            where: { id: req.params.id },
            data: {
                name: name !== undefined ? name : current.name,
                input_schema: input_schema !== undefined ? JSON.stringify(input_schema) : current.input_schema,
                start_step_id: start_step_id !== undefined ? start_step_id : current.start_step_id,
                is_active: is_active !== undefined ? is_active : current.is_active,
                version: current.version + 1
            }
        });
        res.json(workflow);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteWorkflow = async (req, res) => {
    try {
        await prisma.workflow.delete({ where: { id: req.params.id } });
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
