import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnquiryService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    customerName?: string;
    enquiryType: string;
    mobileNumber: string;
    vehicleModel?: string;
    leadSources: string[];
    executiveName?: string;
  }) {
    return this.prisma.enquiry.create({
      data
    });
  }

  async findAll() {
    return this.prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByMobile(mobileNumber: string) {
    return this.prisma.enquiry.findMany({
      where: { mobileNumber },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.enquiry.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: {
    customerName?: string;
    enquiryType?: string;
    mobileNumber?: string;
    vehicleModel?: string;
    leadSources?: string[];
    executiveName?: string;
  }) {
    return this.prisma.enquiry.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    return this.prisma.enquiry.delete({
      where: { id }
    });
  }
}