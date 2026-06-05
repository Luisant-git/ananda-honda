import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';

type CustomerRequestDto = {
  name?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  contactNo?: string;
  address?: string;
  location?: string;
  status?: string;
  branch?: string;

  enquiryDate?: string;
  vehicleModel?: string;
  color?: string;
  variant?: string;
  interestLevel?: string;
  purchaseType?: string;
  exchangeDetails?: string;
  assignedExecutive?: string;
  remarks?: string;
};

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CustomerRequestDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get('stats/walkin-dashboard')
  getWalkinDashboardStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.customerService.getDashboardStats(fromDate, toDate);
  }

  // ✅ PUT THIS ROUTE BEFORE THE :id ROUTE!
  @Get(':id/details')
  getDetails(@Param('id') id: string) {
    console.log("[Controller] getDetails called with ID:", id);
    return this.customerService.getDetails(+id);
  }

  @Get('mobile/:mobile')
  findByMobile(@Param('mobile') mobile: string) {
    return this.customerService.findByMobile(mobile);
  }

  @Get('search/:contact')
  searchByContact(@Param('contact') contact: string) {
    return this.customerService.searchByContact(contact);
  }

  // ✅ THIS GENERIC ROUTE COMES LAST
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: CustomerRequestDto) {
    return this.customerService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.customerService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}