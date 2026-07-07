import { Module } from '@nestjs/common';
import { FeedbackNotificationController } from './feedback-notification.controller';
import { FeedbackNotificationService } from './feedback-notification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackNotificationController],
  providers: [FeedbackNotificationService],
  exports: [FeedbackNotificationService],
})
export class FeedbackNotificationModule {}
