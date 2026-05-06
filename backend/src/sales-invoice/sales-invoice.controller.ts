import {
  Controller, Get, Post, Delete, Param, Query,
  UploadedFile, UseInterceptors, HttpException, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SalesInvoiceService } from './sales-invoice.service';

@Controller('sales-invoices')
export class SalesInvoiceController {
  constructor(private readonly salesInvoiceService: SalesInvoiceService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    try {
      return await this.salesInvoiceService.uploadFile(file.buffer);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.salesInvoiceService.findAll(search);
  }

  @Delete('clear')
  clearAll() {
    return this.salesInvoiceService.clearAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesInvoiceService.remove(+id);
  }
}
