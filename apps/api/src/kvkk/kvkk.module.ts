import { Module } from '@nestjs/common';
import { KvkkService } from './kvkk.service';
import { KvkkController } from './kvkk.controller';

@Module({
  controllers: [KvkkController],
  providers: [KvkkService],
  exports: [KvkkService],
})
export class KvkkModule {}
