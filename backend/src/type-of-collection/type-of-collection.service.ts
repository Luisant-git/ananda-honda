import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TypeOfCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { typeOfCollect: string; status: string; disableVehicleModel?: boolean }) {
    return this.prisma.typeOfCollection.create({
      data
    });
  }

  async findAll() {
    return this.prisma.typeOfCollection.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.typeOfCollection.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: { typeOfCollect?: string; status?: string; disableVehicleModel?: boolean }) {
    return this.prisma.typeOfCollection.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    const paymentCollectionCount = await this.prisma.paymentCollection.count({
      where: { typeOfCollectionId: id }
    });
    
    if (paymentCollectionCount > 0) {
      throw new Error('Cannot delete type of collection with existing payment collection records');
    }
    
    return this.prisma.typeOfCollection.delete({
      where: { id }
    });
  }
}