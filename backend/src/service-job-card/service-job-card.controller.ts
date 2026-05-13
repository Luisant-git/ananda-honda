// service-job-card.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Body,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ServiceJobCardService } from './service-job-card.service';

@Controller('service-job-card')
export class ServiceJobCardController {
  constructor(private readonly serviceJobCardService: ServiceJobCardService) {}

  // ✅ Upload Excel
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (!file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      throw new HttpException(
        'Only Excel/CSV files are allowed',
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      return await this.serviceJobCardService.uploadFile(file.buffer);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ✅ Get All / Search with include parameter
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('include') include?: string,
    @Query('mobileNumber') mobileNumber?: string
  ) {
    // If mobileNumber is provided, return by mobile number
    if (mobileNumber) {
      return this.serviceJobCardService.findByMobileNumber(
        mobileNumber, 
        include === 'serviceType'
      );
    }
    
    // Otherwise return all with optional search
    return this.serviceJobCardService.findAll(search, include === 'serviceType');
  }

  // ✅ Get Active Job Cards (only Pending status) for dropdown
  @Get('active')
  async findActiveJobCards(@Query('search') search?: string) {
    return this.serviceJobCardService.findActiveJobCards(search);
  }

  // ✅ Get Active Job Cards by Mobile Number
  @Get('active/by-mobile/:mobileNumber')
  async findActiveByMobileNumber(
    @Param('mobileNumber') mobileNumber: string
  ) {
    if (!mobileNumber) {
      throw new HttpException('Mobile number is required', HttpStatus.BAD_REQUEST);
    }
    return this.serviceJobCardService.findActiveJobCardsByMobileNumber(mobileNumber);
  }

  // ✅ Search endpoint (alternative)
  @Get('search')
  async search(
    @Query('q') searchTerm: string,
    @Query('include') include?: string
  ) {
    if (!searchTerm) {
      throw new HttpException('Search term is required', HttpStatus.BAD_REQUEST);
    }
    
    return this.serviceJobCardService.search(searchTerm, include === 'serviceType');
  }

  // ✅ Get by mobile number (explicit endpoint)
  @Get('by-mobile/:mobileNumber')
  async findByMobileNumber(
    @Param('mobileNumber') mobileNumber: string,
    @Query('include') include?: string
  ) {
    return this.serviceJobCardService.findByMobileNumber(mobileNumber, include === 'serviceType');
  }

  // ✅ Create Manual
  @Post()
  create(@Body() dto: any) {
    if (!dto.registrationNumber) {
      throw new HttpException(
        'Registration Number is required',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.serviceJobCardService.create(dto);
  }

  // ✅ IMPORTANT: Clear BEFORE :id
  @Delete('clear')
  clearAll() {
    return this.serviceJobCardService.clearAll();
  }

  // ✅ Get One with include
  @Get(':id')
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    return this.serviceJobCardService.findOne(+id);
  }

  // ✅ Update Status (Updated to accept object)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (!body.status) {
      throw new HttpException(
        'Status is required',
        HttpStatus.BAD_REQUEST
      );
    }

    return this.serviceJobCardService.updateStatus(+id, body);
  }

  // ✅ Delete One
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceJobCardService.remove(+id);
  }
}