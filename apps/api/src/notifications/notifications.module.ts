import { Module, Global, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';

@Global()
@Module({})
export class NotificationsModule {
  static forRoot(): DynamicModule {
    const redisDisabled = process.env.REDIS_DISABLED === 'true';

    const imports = redisDisabled
      ? []
      : [
          BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              connection: {
                host: config.get('REDIS_HOST') || 'localhost',
                port: parseInt(config.get('REDIS_PORT') || '6379'),
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
              },
            }),
          }),
          BullModule.registerQueue({ name: 'notifications' }),
        ];

    return {
      module: NotificationsModule,
      global: true,
      imports,
      controllers: [NotificationsController],
      providers: [
        NotificationsService,
        ...(redisDisabled ? [] : [NotificationsProcessor]),
        { provide: 'REDIS_DISABLED', useValue: redisDisabled },
      ],
      exports: [NotificationsService],
    };
  }
}
