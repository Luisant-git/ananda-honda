import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleModelService } from './vehicle-model.service';
@Controller('vehicle-models')
export class VehicleModelController {
  constructor(private readonly vehicleModelService: VehicleModelService) {}

  @Post()
  create(@Body() createVehicleModelDto: { model: string; status: string }) {
    return this.vehicleModelService.create(createVehicleModelDto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    try {
      return await this.vehicleModelService.uploadFile(file.buffer);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  findAll() {
    return this.vehicleModelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehicleModelService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleModelDto: { model?: string; status?: string }) {
    return this.vehicleModelService.update(+id, updateVehicleModelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.vehicleModelService.remove(+id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}