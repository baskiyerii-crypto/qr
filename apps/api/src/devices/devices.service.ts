import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceStatus } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async listPending(companyId: string) {
    return this.prisma.employeeDevice.findMany({
      where: {
        status: DeviceStatus.PENDING,
        employee: { companyId },
      },
      include: {
        employee: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });
  }

  async approve(companyId: string, deviceId: string, approve: boolean) {
    const device = await this.prisma.employeeDevice.findFirst({
      where: { id: deviceId, employee: { companyId } },
    });
    if (!device) throw new NotFoundException('Cihaz bulunamadı');

    return this.prisma.employeeDevice.update({
      where: { id: deviceId },
      data: {
        status: approve ? DeviceStatus.APPROVED : DeviceStatus.REJECTED,
        approvedAt: approve ? new Date() : null,
      },
    });
  }
}
