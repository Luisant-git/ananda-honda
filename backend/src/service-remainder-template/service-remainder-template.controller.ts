import { Controller, Get, Post, Patch, Param, Delete, Query, Body } from '@nestjs/common';
import { ServiceRemainderTemplateService } from './service-remainder-template.service';

@Controller('service-reminders')
export class ServiceRemainderTemplateController {
  constructor(private readonly serviceRemainderTemplateService: ServiceRemainderTemplateService) {}

 @Post('test')
  async testReminder(@Body() body: {
    customerName: string;
    phoneNumber: string;
    vehicleModel: string;    registrationNo: string;
    serviceName: string;
    reminderNumber: number;
    dueDate: string;
  }) {
    return this.serviceRemainderTemplateService.sendTestReminder(body);
  }

@Get()
async getReminders(
  @Query('status') status?: string,
  @Query('serviceType') serviceType?: string,
  @Query('fromDate') fromDate?: string,
  @Query('toDate') toDate?: string,
  @Query('invoiceId') invoiceId?: string,
  @Query('limit') limit?: string,
) {
  const filters: any = {};
  
  if (status) filters.status = status;
  if (serviceType) filters.serviceType = serviceType;
  if (fromDate) filters.fromDate = new Date(fromDate);
  if (toDate) filters.toDate = new Date(toDate);
  if (invoiceId) filters.invoiceId = parseInt(invoiceId);
  if (limit) filters.limit = parseInt(limit);
  
  return this.serviceRemainderTemplateService.getAllReminders(filters);
}

 

  @Get('summary')
  async getSummary() {
    return this.serviceRemainderTemplateService.getReminderSummary();
  }

  @Get(':id')
  async getReminderById(@Param('id') id: string) {
    return this.serviceRemainderTemplateService.getReminderById(+id);
  }



  @Post('trigger')
  async triggerReminders() {
    return this.serviceRemainderTemplateService.triggerRemindersManually();
  }

  @Post(':id/resend')
  async resendReminder(@Param('id') id: string) {
    return this.serviceRemainderTemplateService.resendReminder(+id);
  }

  

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; errorMessage?: string }
  ) {
    return this.serviceRemainderTemplateService.updateReminderLogStatus(+id, body.status, body.errorMessage);
  }



  @Delete(':id')
  async deleteReminder(@Param('id') id: string) {
    return this.serviceRemainderTemplateService.deleteReminderLog(+id);
  }
}