import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { TypeOfCollectionService } from './type-of-collection.service';

@Controller('type-of-collections')
export class TypeOfCollectionController {
  constructor(private readonly typeOfCollectionService: TypeOfCollectionService) {}

  @Post()
  create(@Body() createTypeOfCollectionDto: { typeOfCollect: string; status: string; disableVehicleModel?: boolean }) {
    return this.typeOfCollectionService.create(createTypeOfCollectionDto);
  }

  @Get()
  findAll() {
    return this.typeOfCollectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeOfCollectionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeOfCollectionDto: { typeOfCollect?: string; status?: string; disableVehicleModel?: boolean }) {
    return this.typeOfCollectionService.update(+id, updateTypeOfCollectionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.typeOfCollectionService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}