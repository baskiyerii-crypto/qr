import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const KVKK_VERSION = '1.0';

@Injectable()
export class KvkkService {
  constructor(private prisma: PrismaService) {}

  getDisclosureText() {
    return {
      version: KVKK_VERSION,
      title: 'Kişisel Verilerin Korunması Aydınlatma Metni',
      sections: [
        {
          title: 'İşlenen Veriler',
          content:
            'Kimlik bilgileri, iletişim bilgileri, giriş-çıkış kayıtları, konum verisi (yalnızca giriş/çıkış anında), cihaz tanımlayıcısı, mesaj ve görev verileri.',
        },
        {
          title: 'İşleme Amacı',
          content:
            'Personel devam takibi, puantaj hesaplama, izin yönetimi, işverenin yönetim hakkı kapsamında çalışma disiplini.',
        },
        {
          title: 'Konum Verisi',
          content:
            'Konum bilgisi yalnızca QR ile giriş/çıkış işlemi sırasında alınır. Sürekli konum takibi yapılmaz.',
        },
        {
          title: 'Saklama Süresi',
          content:
            'Veriler şirket ayarlarında belirlenen süre boyunca saklanır, ardından silinir veya anonimleştirilir.',
        },
        {
          title: 'Haklarınız',
          content:
            'Verilerinize erişim, düzeltme ve silme talebinde bulunma hakkına sahipsiniz.',
        },
      ],
    };
  }

  async acceptConsent(params: {
    companyId: string;
    employeeId?: string;
    userId?: string;
    ipAddress?: string;
  }) {
    return this.prisma.kvkkConsent.create({
      data: {
        companyId: params.companyId,
        employeeId: params.employeeId,
        userId: params.userId,
        version: KVKK_VERSION,
        ipAddress: params.ipAddress,
      },
    });
  }

  async hasConsent(employeeId: string) {
    const consent = await this.prisma.kvkkConsent.findFirst({
      where: { employeeId, version: KVKK_VERSION },
      orderBy: { acceptedAt: 'desc' },
    });
    return !!consent;
  }

  async getMyData(employeeId: string) {
    const employee = await this.prisma.employee.findUniqueOrThrow({
      where: { id: employeeId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true, phone: true, createdAt: true } },
        attendanceRecords: { take: 10, orderBy: { serverTimestamp: 'desc' } },
        devices: true,
        kvkkConsents: true,
      },
    });

    return {
      profile: employee.user,
      position: employee.position,
      hireDate: employee.hireDate,
      recentAttendance: employee.attendanceRecords.map((r) => ({
        type: r.type,
        date: r.serverTimestamp,
        withinGeofence: r.withinGeofence,
      })),
      registeredDevices: employee.devices.length,
      consents: employee.kvkkConsents,
      note: 'Konum koordinatları güvenlik nedeniyle özetlenmiştir.',
    };
  }
}
