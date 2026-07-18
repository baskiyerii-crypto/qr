import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as webpush from 'web-push';

type PushJob = {
  pushToken?: string | null;
  webPushSubscription?: string | null;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private vapidReady = false;

  constructor() {
    super();
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@qr-personel.local';
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidReady = true;
    } else {
      this.logger.warn('VAPID keys missing — web push disabled');
    }
  }

  async process(job: Job<PushJob>) {
    const { pushToken, webPushSubscription, title, body, data } = job.data;
    const results = { expo: false, web: false };

    if (pushToken) {
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
        results.expo = res.ok;
        if (!res.ok) this.logger.warn(`Expo push failed: ${res.status}`);
      } catch (err) {
        this.logger.warn(`Expo push error: ${err}`);
      }
    }

    if (webPushSubscription && this.vapidReady) {
      try {
        const sub = JSON.parse(webPushSubscription) as webpush.PushSubscription;
        await webpush.sendNotification(
          sub,
          JSON.stringify({ title, body, data: data ?? {} }),
        );
        results.web = true;
      } catch (err) {
        this.logger.warn(`Web push error: ${err}`);
      }
    }

    if (results.expo || results.web) {
      this.logger.log(`Push sent: ${title}`);
    }
    return { sent: results.expo || results.web, ...results };
  }
}
