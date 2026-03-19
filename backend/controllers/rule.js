const prisma = require('../prisma');

exports.createRule = async (req, res) => {
    try {
        const { step_id } = req.params;
        const { condition, next_step_id, priority } = req.body;
        const rule = await prisma.rule.create({
            data: { step_id, condition, next_step_id, priority }
        });
        res.status(201).json(rule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.getRules = async (req, res) => {
    try {
        const { step_id } = req.params;
        const rules = await prisma.rule.findMany({
            where: { step_id },
            orderBy: { priority: 'asc' }
        });
        res.json(rules);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.updateRule = async (req, res) => {
    try {
        const { condition, next_step_id, priority } = req.body;
        const rule = await prisma.rule.update({
            where: { id: req.params.id },
            data: { condition, next_step_id, priority }
        });
        res.json(rule);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

exports.deleteRule = async (req, res) => {
    try {
        await prisma.rule.delete({ where: { id: req.params.id } });
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
