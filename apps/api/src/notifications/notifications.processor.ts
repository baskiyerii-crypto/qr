import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<{ pushToken: string; title: string; body: string; data?: Record<string, unknown> }>) {
    const { pushToken, title, body, data } = job.data;
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          title,
          body,
          data: data ?? {},
          sound: 'default',
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Expo push failed: ${res.status}`);
        return { sent: false };
      }
      this.logger.log(`Push sent: ${title}`);
      return { sent: true };
    } catch (err) {
      this.logger.warn(`Push error: ${err}`);
      return { sent: false };
    }
  }
}
