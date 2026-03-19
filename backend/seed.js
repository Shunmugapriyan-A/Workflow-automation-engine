const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production-grade demo data...');

  // 1. Create Workflow
  const workflow = await prisma.workflow.create({
    data: {
      name: 'Corporate Expense Flow',
      version: 1,
      input_schema: JSON.stringify({
        amount: { type: 'number', required: true },
        category: { type: 'string', allowed_values: ['Travel', 'Equipment', 'Software', 'Other'] },
        urgency: { type: 'string', allowed_values: ['Normal', 'High'] }
      })
    }
  });

  // 2. Create Steps
  const step1 = await prisma.step.create({
    data: {
      workflow_id: workflow.id,
      name: 'Manager Review',
      step_type: 'approval',
      order: 1
    }
  });

  const step2 = await prisma.step.create({
    data: {
      workflow_id: workflow.id,
      name: 'Executive Board Approval',
      step_type: 'approval',
      order: 2
    }
  });

  const step3 = await prisma.step.create({
    data: {
      workflow_id: workflow.id,
      name: 'Process Reimbursement',
      step_type: 'task',
      order: 3
    }
  });

  const step4 = await prisma.step.create({
    data: {
      workflow_id: workflow.id,
      name: 'Rejection Log & Notify',
      step_type: 'notification',
      order: 4
    }
  });

  // 3. Set Start Step
  await prisma.workflow.update({
    where: { id: workflow.id },
    data: { start_step_id: step1.id }
  });

  // 4. Create Rules
  // Manager Review Rules
  await prisma.rule.createMany({
    data: [
      { step_id: step1.id, condition: 'amount > 5000', next_step_id: step2.id, priority: 1 },
      { step_id: step1.id, condition: 'amount <= 5000 && urgency == "Normal"', next_step_id: step3.id, priority: 2 },
      { step_id: step1.id, condition: 'DEFAULT', next_step_id: step2.id, priority: 3 }
    ]
  });

  // Executive Board Rules
  await prisma.rule.createMany({
    data: [
      { step_id: step2.id, condition: 'category == "Software"', next_step_id: step3.id, priority: 1 },
      { step_id: step2.id, condition: 'DEFAULT', next_step_id: null, priority: 2 }
    ]
  });

  console.log('Production seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
