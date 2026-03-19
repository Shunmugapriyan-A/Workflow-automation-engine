const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const workflows = await prisma.workflow.findMany({
    include: { steps: { include: { rules: true } } }
  });
  console.log(JSON.stringify(workflows, null, 2));
}

check().finally(() => prisma.$disconnect());
