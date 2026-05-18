import { Module } from '@nestjs/common';
import { ServiceRemainderTemplateService } from './service-remainder-template.service';
import { ServiceRemainderTemplateController } from './service-remainder-template.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [ServiceRemainderTemplateController],
  providers: [ServiceRemainderTemplateService],
  exports: [ServiceRemainderTemplateService],
})
export class ServiceRemainderTemplateModule {}