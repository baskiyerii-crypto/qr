import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type WebPushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
};

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @InjectQueue('notifications') private queue?: Queue,
    @Optional() @Inject('REDIS_DISABLED') private redisDisabled?: boolean,
  ) {}

  private async enqueuePush(
    userId: string | null,
    employeeId: string | null,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    if (this.redisDisabled || !this.queue) return;
    try {
      let pushToken: string | null = null;
      let webPushSubscription: string | null = null;
      if (userId) {
        const u = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pushToken: true, webPushSubscription: true },
        });
        pushToken = u?.pushToken ?? null;
        webPushSubscription = u?.webPushSubscription ?? null;
      } else if (employeeId) {
        const e = await this.prisma.employee.findUnique({
          where: { id: employeeId },
          include: { user: { select: { pushToken: true, webPushSubscription: true } } },
        });
        pushToken = e?.user.pushToken ?? null;
        webPushSubscription = e?.user.webPushSubscription ?? null;
      }
      if (!pushToken && !webPushSubscription) return;
      await this.queue.add('push', { pushToken, webPushSubscription, title, body, data });
    } catch {
      // Redis yoksa sadece DB kaydı yeterli
    }
  }

  async notifyEmployee(
    companyId: string,
    employeeId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        employeeId,
        title,
        body,
        type,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    await this.enqueuePush(null, employeeId, title, body, { ...(data ?? {}), type });
    return notification;
  }

  async notifyUser(
    companyId: string,
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        userId,
        title,
        body,
        type,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    await this.enqueuePush(userId, null, title, body, { ...(data ?? {}), type });
    return notification;
  }

  async notifyUserOptional(
    companyId: string | null,
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        companyId,
        userId,
        title,
        body,
        type,
        data: (data ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    await this.enqueuePush(userId, null, title, body, { ...(data ?? {}), type });
    return notification;
  }

  async getForUser(userId?: string, employeeId?: string) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(employeeId ? [{ employeeId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async registerDevice(
    userId: string,
    dto: {
      pushToken?: string | null;
      webPushSubscription?: WebPushSubscriptionPayload | null;
    },
  ) {
    const data: { pushToken?: string | null; webPushSubscription?: string | null } = {};
    if (dto.pushToken !== undefined) {
      data.pushToken = dto.pushToken;
    }
    if (dto.webPushSubscription !== undefined) {
      data.webPushSubscription = dto.webPushSubscription
        ? JSON.stringify(dto.webPushSubscription)
        : null;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, pushToken: true, webPushSubscription: true },
    });
  }

  /** @deprecated use registerDevice */
  async registerPushToken(userId: string, pushToken: string) {
    return this.registerDevice(userId, { pushToken });
  }

  getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
  }
}
