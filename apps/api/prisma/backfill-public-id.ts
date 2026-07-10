import { PrismaClient } from '@prisma/client';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePublicId(): string {
  let code = '';
  for (let i = 0; i < 8; i++) code += CHARS[Math.floor(Math.random() * CHARS.length)];
  return `QR-U-${code}`;
}

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({ where: { publicId: null } });
  const used = new Set(
    (await prisma.user.findMany({ where: { publicId: { not: null } }, select: { publicId: true } }))
      .map((u) => u.publicId!),
  );

  for (const user of users) {
    let publicId = generatePublicId();
    while (used.has(publicId)) publicId = generatePublicId();
    used.add(publicId);
    await prisma.user.update({ where: { id: user.id }, data: { publicId } });
    console.log(`Updated ${user.email} -> ${publicId}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
