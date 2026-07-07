import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FeedbackNotificationService } from './feedback-notification.service';
import { Role } from '@prisma/client';

@Controller('feedback-notification')
export class FeedbackNotificationController {
  constructor(private readonly feedbackNotificationService: FeedbackNotificationService) {}

  @Get()
  async getAllSettings() {
    return this.feedbackNotificationService.getAll();
  }

  @Post(':role')
  async upsertSetting(@Param('role') role: Role, @Body('mobileNumber') mobileNumber: string) {
    return this.feedbackNotificationService.upsert(role, mobileNumber);
  }
}
