import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehicleModelService {
  constructor(private prisma: PrismaService) {}

  async create(data: { model: string; status: string }) {
    return this.prisma.vehicleModel.create({
      data
    });
  }

  async findAll() {
    return this.prisma.vehicleModel.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.vehicleModel.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: { model?: string; status?: string }) {
    return this.prisma.vehicleModel.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    const paymentCollectionCount = await this.prisma.paymentCollection.count({
      where: { vehicleModelId: id }
    });
    
    if (paymentCollectionCount > 0) {
      throw new Error('Cannot delete vehicle model with existing payment collection records');
    }
    
    return this.prisma.vehicleModel.delete({
      where: { id }
    });
  }
}