import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EnquiryService } from './enquiry.service';

@Controller('enquiries')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Post()
  create(
    @Body()
    createEnquiryDto: {
      customerName?: string;
      enquiryType: string;
      mobileNumber: string;
      vehicleModel?: string;
      leadSources: string[];
      executiveName?: string;
    },
  ) {
    return this.enquiryService.create(createEnquiryDto);
  }

  @Get()
  findAll() {
    return this.enquiryService.findAll();
  }

  @Get('mobile/:mobileNumber')
  findByMobile(@Param('mobileNumber') mobileNumber: string) {
    return this.enquiryService.findByMobile(mobileNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enquiryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateEnquiryDto: {
      customerName?: string;
      enquiryType?: string;
      mobileNumber?: string;
      vehicleModel?: string;
      leadSources?: string[];
      executiveName?: string;
    },
  ) {
    return this.enquiryService.update(+id, updateEnquiryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enquiryService.remove(+id);
  }
}
