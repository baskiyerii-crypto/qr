import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function publicId(i: number) {
  return `QR-U-SEED${String(i).padStart(4, '0')}`;
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const empPassword = await bcrypt.hash('Personel123!', 12);
  const superPassword = await bcrypt.hash('Super123!', 12);
  const yusufSuperPassword = await bcrypt.hash('yusuf634152K', 12);
  const resellerPassword = await bcrypt.hash('Bayi123!', 12);
  const marketerPassword = await bcrypt.hash('Pazarlamaci123!', 12);

  const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const evolutionApiKey = process.env.EVOLUTION_API_KEY || 'qr_evolution_dev_key_7f3a9b2c';
  const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'qr-personel';
  const webAppUrl = process.env.WEB_APP_URL || 'http://localhost:5173';

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: { webAppUrl, evolutionApiUrl, evolutionApiKey, evolutionInstance },
    create: { id: 'default', defaultCommissionRate: 0.15, monthlySubscriptionFee: 299, webAppUrl, evolutionApiUrl, evolutionApiKey, evolutionInstance },
  });

  await prisma.commissionPayoutConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', payoutFrequency: 'INSTANT', holdDays: 0 },
  });

  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: 'baslangic' },
    update: {},
    create: { name: 'Başlangıç', slug: 'baslangic', monthlyPrice: 299, maxEmployees: 50, maxBranches: 1, platformShareRate: 0.70, resellerShareRate: 0.30, sortOrder: 1 },
  });

  await prisma.platformSettings.update({ where: { id: 'default' }, data: { defaultPlanId: starterPlan.id } });

  await prisma.user.upsert({
    where: { email: 'super@qr.com' },
    update: { publicId: publicId(1) },
    create: { email: 'super@qr.com', passwordHash: superPassword, role: UserRole.SUPER_ADMIN, firstName: 'Platform', lastName: 'Admin', publicId: publicId(1), isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'yusuf@yusuf.com' },
    update: { passwordHash: yusufSuperPassword, role: UserRole.SUPER_ADMIN, publicId: publicId(2), isActive: true },
    create: { email: 'yusuf@yusuf.com', passwordHash: yusufSuperPassword, role: UserRole.SUPER_ADMIN, firstName: 'Yusuf', lastName: 'Yönetici', publicId: publicId(2), isActive: true },
  });

  const marketerUser = await prisma.user.upsert({
    where: { email: 'pazarlamaci@demo.com' },
    update: { publicId: publicId(3) },
    create: {
      email: 'pazarlamaci@demo.com', passwordHash: marketerPassword, role: UserRole.MARKETER,
      firstName: 'Demo', lastName: 'Pazarlamacı', publicId: publicId(3), phone: '05550000001', isActive: true,
    },
  });

  const marketer = await prisma.marketer.upsert({
    where: { userId: marketerUser.id },
    update: { commissionRate: 0.20 },
    create: { userId: marketerUser.id, companyName: 'Demo Pazarlamacı Ltd.', code: 'DEMO-PAZ', commissionRate: 0.20, phone: '05550000001' },
  });

  const resellerUser = await prisma.user.upsert({
    where: { email: 'bayi@demo.com' },
    update: { publicId: publicId(4) },
    create: { email: 'bayi@demo.com', passwordHash: resellerPassword, role: UserRole.RESELLER, firstName: 'Demo', lastName: 'Bayi', publicId: publicId(4), isActive: true },
  });

  const reseller = await prisma.reseller.upsert({
    where: { userId: resellerUser.id },
    update: { marketerId: marketer.id, commissionRate: 0.20 },
    create: { userId: resellerUser.id, marketerId: marketer.id, companyName: 'Demo Bayi Ltd.', code: 'DEMO-BAYI', commissionRate: 0.20 },
  });

  let company = await prisma.company.findUnique({ where: { slug: 'demo-sirket' }, include: { branches: true, departments: true } });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Demo Şirket A.Ş.', slug: 'demo-sirket', resellerId: reseller.id,
        monthlySubscriptionFee: 299,
        branches: { create: { name: 'Merkez Ofis', address: 'İstanbul', latitude: 41.0082, longitude: 28.9784, geofenceRadiusM: 300 } },
        departments: { create: [{ name: 'İnsan Kaynakları' }, { name: 'Operasyon' }] },
      },
      include: { branches: true, departments: true },
    });
  } else {
    await prisma.company.update({ where: { id: company.id }, data: { resellerId: reseller.id } });
  }

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { publicId: publicId(5) },
    create: { email: 'admin@demo.com', passwordHash, role: UserRole.COMPANY_ADMIN, companyId: company.id, firstName: 'Demo', lastName: 'Admin', publicId: publicId(5), isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'ik@demo.com' },
    update: { passwordHash, publicId: publicId(7), isActive: true },
    create: {
      email: 'ik@demo.com', passwordHash, role: UserRole.HR_MANAGER, companyId: company.id,
      firstName: 'Demo', lastName: 'İK', publicId: publicId(7), isActive: true,
    },
  });

  const regionalUser = await prisma.user.upsert({
    where: { email: 'bolge@demo.com' },
    update: { passwordHash, publicId: publicId(8), isActive: true },
    create: {
      email: 'bolge@demo.com', passwordHash, role: UserRole.REGIONAL_MANAGER, companyId: company.id,
      firstName: 'Demo', lastName: 'Bölge', publicId: publicId(8), isActive: true,
    },
  });

  const branchUser = await prisma.user.upsert({
    where: { email: 'sube@demo.com' },
    update: { passwordHash, publicId: publicId(9), isActive: true },
    create: {
      email: 'sube@demo.com', passwordHash, role: UserRole.BRANCH_MANAGER, companyId: company.id,
      firstName: 'Demo', lastName: 'Şube', publicId: publicId(9), isActive: true,
    },
  });

  const branchId = company.branches[0]?.id;
  if (branchId) {
    await prisma.branchAssignment.upsert({
      where: { userId_branchId: { userId: regionalUser.id, branchId } },
      update: {},
      create: { userId: regionalUser.id, branchId },
    });
    await prisma.branchAssignment.upsert({
      where: { userId_branchId: { userId: branchUser.id, branchId } },
      update: {},
      create: { userId: branchUser.id, branchId },
    });
  }

  const empUser = await prisma.user.upsert({
    where: { email: 'personel@demo.com' },
    update: { publicId: publicId(6), isActive: true },
    create: { email: 'personel@demo.com', passwordHash: empPassword, role: UserRole.EMPLOYEE, companyId: company.id, firstName: 'Ayşe', lastName: 'Yılmaz', publicId: publicId(6), isActive: true },
  });

  await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: {},
    create: { companyId: company.id, userId: empUser.id, branchId: company.branches[0]?.id, departmentId: company.departments[0]?.id, position: 'Operasyon Uzmanı', monthlySalary: 35000, hireDate: new Date('2024-01-15') },
  });

  console.log('\n=== Demo Kullanıcıları (tüm roller) ===\n');
  const creds = [
    ['Süper Admin', 'yusuf@yusuf.com', 'yusuf634152K'],
    ['Süper Admin (yedek)', 'super@qr.com', 'Super123!'],
    ['Pazarlamacı', 'pazarlamaci@demo.com', 'Pazarlamaci123!'],
    ['Bayi', 'bayi@demo.com', 'Bayi123!'],
    ['Şirket Yöneticisi', 'admin@demo.com', 'Admin123!'],
    ['İK Yöneticisi', 'ik@demo.com', 'Admin123!'],
    ['Bölge Yöneticisi', 'bolge@demo.com', 'Admin123!'],
    ['Şube Yöneticisi', 'sube@demo.com', 'Admin123!'],
    ['Personel', 'personel@demo.com', 'Personel123!'],
  ];
  console.log('Rol'.padEnd(22) + 'E-posta'.padEnd(28) + 'Şifre');
  console.log('-'.repeat(62));
  for (const [role, email, pass] of creds) {
    console.log(`${role.padEnd(22)}${email.padEnd(28)}${pass}`);
  }
  console.log('\nBayi kodu: DEMO-BAYI | Pazarlamacı kodu: DEMO-PAZ\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
