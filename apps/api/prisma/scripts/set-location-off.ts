import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const current = await prisma.platformSettings.findUnique({ where: { id: 'default' } });
  console.log('Mevcut ayar:', current?.requireEmployeeLocation);

  const updated = await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: { requireEmployeeLocation: false },
    create: { id: 'default', requireEmployeeLocation: false },
  });

  console.log('Güncellendi → requireEmployeeLocation:', updated.requireEmployeeLocation);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
