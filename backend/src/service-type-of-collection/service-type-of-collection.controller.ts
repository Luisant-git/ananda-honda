import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ServiceTypeOfCollectionService } from './service-type-of-collection.service';

@Controller('service-type-of-collection')
export class ServiceTypeOfCollectionController {
  constructor(
    private readonly serviceTypeOfCollectionService: ServiceTypeOfCollectionService,
  ) {}

  
  @Post()
  create(
    @Body()
    body: {
      typeOfCollect: string;
      status: string;
      disableVehicleModel?: boolean;
    },
  ) {
    return this.serviceTypeOfCollectionService.create(body);
  }


  @Get()
  findAll() {
    return this.serviceTypeOfCollectionService.findAll();
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceTypeOfCollectionService.findOne(+id);
  }


  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      typeOfCollect?: string;
      status?: string;
      disableVehicleModel?: boolean;
    },
  ) {
    return this.serviceTypeOfCollectionService.update(+id, body);
  }


  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.serviceTypeOfCollectionService.remove(+id);
    } catch (error) {
     throw new Error('Server error');
    }
  }
}