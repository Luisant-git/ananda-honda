import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class FeedbackNotificationService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.feedbackNotificationSetting.findMany();
  }

  async upsert(role: string, mobileNumber: string) {
    if (!mobileNumber) {
        // If empty, we can just delete it
        return this.prisma.feedbackNotificationSetting.deleteMany({
            where: { role }
        });
    }
    return this.prisma.feedbackNotificationSetting.upsert({
      where: { role },
      update: { mobileNumber },
      create: { role, mobileNumber },
    });
  }
}
