import { PrismaService } from '../../prisma/prisma.service';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
type PublicIdPrisma = Pick<PrismaService, 'user'>;

export function generatePublicId(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `QR-U-${code}`;
}

export async function createUniquePublicId(prisma: PublicIdPrisma): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const publicId = generatePublicId();
    const exists = await prisma.user.findUnique({ where: { publicId } });
    if (!exists) return publicId;
  }
  return `QR-U-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}
