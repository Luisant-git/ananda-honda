import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CustomerPayload = {
  name?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  contactNo?: string;
  address?: string;
  location?: string;
  status?: string;
  branch?: string;
  pincode?: string;

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

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(data: CustomerPayload) {
    const lastCustomer = await this.prisma.customer.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nextId = lastCustomer ? lastCustomer.id + 1 : 1;
    const custId = `CUST${nextId.toString().padStart(3, '0')}`;

    const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || data.mobile || data.contactNo || 'Customer';
    const contactNo = data.mobile || data.contactNo || '';

   return this.prisma.customer.create({
  data: {
    custId,
    name,
    contactNo,
    address: data.address || '',
    location: data.location || null,
    pincode: data.pincode || null,
    status: data.status || 'Walk in Customer',
    branch: data.branch || undefined,

    // ✅ NEW FIELDS
    enquiryDate: data.enquiryDate ? new Date(data.enquiryDate) : undefined,
    vehicleModel: data.vehicleModel,
    color: data.color,
    variant: data.variant,
    interestLevel: data.interestLevel,
    purchaseType: data.purchaseType,
    exchangeDetails: data.exchangeDetails,
    assignedExecutive: data.assignedExecutive,
    remarks: data.remarks,
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

  async update(id: number, data: CustomerPayload) {
    const name = data.name || [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    const contactNo = data.mobile || data.contactNo;

   const updateData: {
  name?: string;
  contactNo?: string;
  address?: string;
  location?: string;
  pincode?: string;
  status?: string;
  branch?: string;

  enquiryDate?: Date | null;
  vehicleModel?: string;
  color?: string;
  variant?: string;
  interestLevel?: string;
  purchaseType?: string;
  exchangeDetails?: string;
  assignedExecutive?: string;
  remarks?: string;
} = {};
    if (data.address !== undefined)
      updateData.address = data.address;

    if (contactNo !== undefined)
      updateData.contactNo = contactNo;

    if (name)
      updateData.name = name;

    if (data.status !== undefined)
      updateData.status = data.status;

    if (data.enquiryDate !== undefined)
      updateData.enquiryDate = data.enquiryDate
        ? new Date(data.enquiryDate)
        : null;

    if (data.vehicleModel !== undefined)
      updateData.vehicleModel = data.vehicleModel;

    if (data.color !== undefined)
      updateData.color = data.color;

    if (data.variant !== undefined)
      updateData.variant = data.variant;

    if (data.interestLevel !== undefined)
      updateData.interestLevel = data.interestLevel;

    if (data.purchaseType !== undefined)
      updateData.purchaseType = data.purchaseType;

    if (data.exchangeDetails !== undefined)
      updateData.exchangeDetails = data.exchangeDetails;

    if (data.branch !== undefined)
      updateData.branch = data.branch;

    if (data.assignedExecutive !== undefined)
      updateData.assignedExecutive = data.assignedExecutive;
    if (data.location !== undefined)
      updateData.location = data.location;
    if (data.pincode !== undefined)
      updateData.pincode = data.pincode;
    if (data.remarks !== undefined)
      updateData.remarks = data.remarks;

    return this.prisma.customer.update({
      where: { id },
      data: updateData
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

  async clearAll() {
    return this.prisma.customer.deleteMany({});
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

    const mobile = customer.contactNo?.trim();

    // ✅ Enquiries - matched by mobile number
    const enquiries = await this.prisma.enquiry.findMany({
      where: {
        mobileNumber: {
          equals: mobile,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ✅ Sales Invoices - matched by contact info (mobile)
    const salesInvoices = await this.prisma.salesInvoice.findMany({
      where: {
        contactInfo: {
          equals: mobile,
          mode: 'insensitive',
        },
      },
      orderBy: { id: 'desc' },
    });

    // ✅ Service Job Cards - matched by mobile number (same as enquiries)
    const serviceJobCards = await this.prisma.serviceJobCard.findMany({
      where: {
        mobileNumber: {
          equals: mobile,
          mode: 'insensitive',
        },
      },
      include: {
        serviceType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...customer,
      enquiries,
      salesInvoices,
      serviceJobCards,
    };
  }

  async getDashboardStats(fromDateStr?: string, toDateStr?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const dateFilter = fromDate && toDate ? {
      createdAt: {
        gte: fromDate,
        lte: toDate,
      }
    } : {};

    const totalEnquiry = await this.prisma.customer.count({
      where: dateFilter,
    });
    
    const todaysEnquiry = await this.prisma.customer.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
    
    const allocatedEnquiries = await this.prisma.customer.count({
      where: {
        ...dateFilter,
        AND: [
          { assignedExecutive: { not: null } },
          { assignedExecutive: { not: '' } },
        ],
      },
    });

    const executivesList = await this.prisma.customer.groupBy({
      by: ['assignedExecutive'],
      _count: {
        assignedExecutive: true,
      },
      where: {
        ...dateFilter,
        AND: [
          { assignedExecutive: { not: null } },
          { assignedExecutive: { not: '' } },
        ],
      },
      orderBy: {
        _count: {
          assignedExecutive: 'desc'
        }
      }
    });

    const bookedList = await this.prisma.salesInvoice.groupBy({
      by: ['assignedTo'],
      _count: {
        assignedTo: true,
      },
      where: {
        ...dateFilter,
        AND: [
          { assignedTo: { not: null } },
          { assignedTo: { not: '' } },
        ],
      },
    });

    const totalBookedCustomers = await this.prisma.salesInvoice.count({
      where: {
        ...dateFilter,
        AND: [
          { assignedTo: { not: null } },
          { assignedTo: { not: '' } },
        ],
      },
    });

    // Merge enquiries and bookings by executive name
    const executiveMap = new Map<string, { executiveName: string; count: number; bookedCount: number }>();

    const normalizeName = (name: string) => name.trim().replace(/[\s.]+$/, '').toUpperCase();
    const cleanDisplay = (name: string) => name.trim().replace(/[\s.]+$/, '');

    executivesList.forEach((item) => {
      if (item.assignedExecutive) {
        const normalized = normalizeName(item.assignedExecutive);
        if (executiveMap.has(normalized)) {
          executiveMap.get(normalized)!.count += item._count.assignedExecutive;
        } else {
          executiveMap.set(normalized, {
            executiveName: cleanDisplay(item.assignedExecutive),
            count: item._count.assignedExecutive,
            bookedCount: 0,
          });
        }
      }
    });

    bookedList.forEach((item) => {
      if (item.assignedTo) {
        const normalized = normalizeName(item.assignedTo);
        if (executiveMap.has(normalized)) {
          executiveMap.get(normalized)!.bookedCount += item._count.assignedTo;
        } else {
          executiveMap.set(normalized, {
            executiveName: cleanDisplay(item.assignedTo),
            count: 0,
            bookedCount: item._count.assignedTo,
          });
        }
      }
    });

    const salesExecutiveList = Array.from(executiveMap.values()).sort((a, b) => b.count - a.count);

    return {
      totalEnquiry,
      todaysEnquiry,
      allocatedEnquiries,
      totalBookedCustomers,
      totalSalesExecutive: salesExecutiveList.length,
      salesExecutiveList,
    };
  }
}