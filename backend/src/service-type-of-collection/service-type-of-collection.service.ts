import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceTypeOfCollectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    typeOfCollect: string;
    status: string;
    disableVehicleModel?: boolean;
  }) {
    return this.prisma.serviceTypeOfCollection.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.serviceTypeOfCollection.findMany({
      orderBy: { id: 'desc' },
    });
  }


  async findOne(id: number) {
    return this.prisma.serviceTypeOfCollection.findUnique({
      where: { id },
    });
  }


  async update(
    id: number,
    data: {
      typeOfCollect?: string;
      status?: string;
      disableVehicleModel?: boolean;
    },
  ) {
    return this.prisma.serviceTypeOfCollection.update({
      where: { id },
      data,
    });
  }


  async remove(id: number) {
    const count =
    await this.prisma.servicePaymentCollection.count({
  where: { id },
});

    if (count > 0) {
      throw new Error(
        'Cannot delete service type of collection with existing service payment records',
      );
    }

    return this.prisma.serviceTypeOfCollection.delete({
      where: { id },
    });
  }
}