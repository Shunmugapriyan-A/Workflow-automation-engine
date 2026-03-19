const prisma = require('../prisma');

exports.createStep = async (req, res) => {
    try {
        const { workflow_id } = req.params;
        const { name, step_type, order, metadata } = req.body;
        const step = await prisma.step.create({
            data: { 
                workflow_id, 
                name, 
                step_type, 
                order, 
                metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata 
            }
        });
        try { if (step.metadata) step.metadata = JSON.parse(step.metadata); } catch(e){}
        res.status(201).json(step);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getSteps = async (req, res) => {
    try {
        const { workflow_id } = req.params;
        const steps = await prisma.step.findMany({
            where: { workflow_id },
            orderBy: { order: 'asc' }
        });
        steps.forEach(s => {
            try { if (s.metadata) s.metadata = JSON.parse(s.metadata); } catch(e){}
        });
        res.json(steps);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateStep = async (req, res) => {
    try {
        const { name, step_type, order, metadata } = req.body;
        const step = await prisma.step.update({
            where: { id: req.params.id },
            data: { 
                name, 
                step_type, 
                order, 
                metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata 
            }
        });
        try { if (step.metadata) step.metadata = JSON.parse(step.metadata); } catch(e){}
        res.json(step);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteStep = async (req, res) => {
    try {
        await prisma.step.delete({ where: { id: req.params.id } });
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
