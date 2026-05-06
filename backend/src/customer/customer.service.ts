import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; contactNo: string; address: string; status: string }) {
    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nextId = lastCustomer ? lastCustomer.id + 1 : 1;
    const custId = `CUST${nextId.toString().padStart(3, '0')}`;

    return this.prisma.customer.create({
      data: {
        custId,
        ...data
      }
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async findOne(id: number) {
    return this.prisma.customer.findUnique({
      where: { id }
    });
  }

  async findByMobile(mobile: string) {
    return this.prisma.customer.findFirst({
      where: { contactNo: mobile }
    });
  }

  async searchByContact(contact: string) {
    const customers = await this.prisma.customer.findMany({
      where: { contactNo: { contains: contact } },
      orderBy: { id: 'desc' }
    });
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: { contactInfo: { contains: contact } },
      orderBy: { id: 'desc' }
    });
    return { customers, salesInvoices };
  }

  async update(id: number, data: { name?: string; contactNo?: string; address?: string; status?: string }) {
    return this.prisma.customer.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    // Check if customer has payment collections
    const paymentCount = await this.prisma.paymentCollection.count({
      where: { customerId: id }
    });
    
    if (paymentCount > 0) {
      throw new Error('Cannot delete customer with existing payment records');
    }
    
    return this.prisma.customer.delete({
      where: { id }
    });
  }

  async getDetails(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        paymentCollections: {
          include: {
            paymentMode: true,
            typeOfPayment: true,
            typeOfCollection: true,
            vehicleModel: true,
            user: true,
          },
          orderBy: { date: 'desc' },
        },
        servicePaymentCollections: {
          include: {
            paymentMode: true,
            typeOfPayment: true,
            serviceTypeOfCollection: true,
            vehicleModel: true,
            user: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer) return null;

    const enquiries = await this.prisma.enquiry.findMany({
      where: { mobileNumber: customer.contactNo },
      orderBy: { createdAt: 'desc' },
    });

    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: { contactInfo: customer.contactNo },
      orderBy: { id: 'desc' },
    });

    return {
      ...customer,
      enquiries,
      salesInvoices,
    };
  }
}