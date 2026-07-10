import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskInput } from '@qr/shared';
import { TaskStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(companyId: string, dto: CreateTaskInput) {
    const task = await this.prisma.task.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: new Date(dto.dueDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        assignments: {
          create: dto.employeeIds.map((employeeId) => ({ employeeId })),
        },
      },
      include: {
        assignments: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    for (const empId of dto.employeeIds) {
      await this.notifications.notifyEmployee(
        companyId,
        empId,
        'Yeni Görev',
        dto.title,
        'TASK_ASSIGNED',
        { taskId: task.id },
      );
    }

    return task;
  }

  async list(companyId: string) {
    return this.prisma.task.findMany({
      where: { companyId },
      include: {
        assignments: {
          include: {
            employee: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async myTasks(employeeId: string) {
    return this.prisma.taskAssignment.findMany({
      where: { employeeId },
      include: { task: true },
      orderBy: { task: { dueDate: 'asc' } },
    });
  }

  async updateStatus(assignmentId: string, employeeId: string, status: TaskStatus) {
    return this.prisma.taskAssignment.updateMany({
      where: { id: assignmentId, employeeId },
      data: {
        status,
        completedAt: status === TaskStatus.COMPLETED ? new Date() : null,
      },
    });
  }
}
