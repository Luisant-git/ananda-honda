import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class SalesInvoiceService {
  constructor(private prisma: PrismaService) { }

  async uploadFile(buffer: Buffer) {
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch (e) {
      // If buffer read fails, try as string (common for some CSV encodings)
      workbook = XLSX.read(buffer.toString(), { type: 'string', cellDates: true });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) throw new BadRequestException('Excel file is empty');

    const records = rows.map((row) => {
      // Mapping for Actual Deliver Date
      const rawDate = row['Actual Deliver date'] || row['Actual Deliver Date'] || row['actual_deliver_date'] || row['ActualDeliverDate'] || '';
      let actualDeliverDate: Date | null = null;
      if (rawDate) {
        const parsed = rawDate instanceof Date ? rawDate : new Date(rawDate);
        if (!isNaN(parsed.getTime())) actualDeliverDate = parsed;
      }

      // Mapping for Customer Name (combine first, middle, last if available)
      const firstName = String(row['Customer First Name'] || '').trim();
      const middleName = String(row['Customer Middle Name'] || '').trim();
      const lastName = String(row['Customer Last Name'] || '').trim();
      let customerName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      if (!customerName) {
        customerName = String(row['Customer Name'] || row['customer_name'] || row['CustomerName'] || '').trim();
      }

      // Mapping for Address
      const address1 = String(row['Address Line 1'] || '').trim();
      const address2 = String(row['Address Line 2'] || '').trim();
      const city = String(row['City'] || '').trim();
      const state = String(row['State'] || '').trim();
      const zipCode = String(row['Zip Code'] || '').trim();

      return {
        customerName,
        contactInfo: String(row['Mobile Phone #'] || row['Contact Info'] || row['contact_info'] || row['ContactInfo'] || row['Contact'] || '').trim(),
        referenceNo: String(row['Reference No'] || row['ReferenceNo'] || row['ref_no'] || '').trim() || null,
        vehicleRegNo: String(row['Permanent Reg No'] || row['Vehicle Reg No'] || row['vehicle_reg_no'] || row['VehicleRegNo'] || '').trim() || null,
        vehicleModel: String(row['Model Name'] || row['Vehicle Model'] || row['vehicle_model'] || row['VehicleModel'] || '').trim() || null,
        assignedTo: String(row['Assigned To (DSE) Name'] || row['Assigned To'] || row['assigned_to'] || row['AssignedTo'] || row['DSE Name'] || '').trim() || null,
        address1: address1 || null,
        address2: address2 || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        actualDeliverDate,
      };
    }).filter(r => r.customerName && r.contactInfo);

    if (!records.length) throw new BadRequestException('No valid rows found. Ensure columns like Customer Name/First Name and Contact Info/Mobile Phone # are present.');

    // Save Sales Invoices
    await this.prisma.salesInvoice.createMany({ data: records, skipDuplicates: false });

    // Auto-create customers if they don't exist
    const uniqueContacts = Array.from(new Set(records.map(r => r.contactInfo)));
    for (const contact of uniqueContacts) {
      const existing = await this.prisma.customer.findFirst({ where: { contactNo: contact } });
      if (!existing) {
        const inv = records.find(r => r.contactInfo === contact);
        if (!inv) continue;

        // Get last customer to generate next custId
        const lastCustomer = await this.prisma.customer.findFirst({ orderBy: { id: 'desc' } });
        const nextId = lastCustomer ? lastCustomer.id + 1 : 1;
        const custId = `CUST${nextId.toString().padStart(3, '0')}`;

        // Combine address for Customer Details
        const fullAddress = [inv.address1, inv.address2, inv.city, inv.state, inv.zipCode].filter(Boolean).join(', ');

        await this.prisma.customer.create({
          data: {
            custId,
            name: inv.customerName,
            contactNo: contact,
            address: fullAddress || 'N/A',
            status: 'Imported from Invoice'
          }
        });
      }
    }

    return { imported: records.length };
  }

  async findAll(search?: string) {
    const where = search ? {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' as const } },
        { contactInfo: { contains: search, mode: 'insensitive' as const } },
        { vehicleRegNo: { contains: search, mode: 'insensitive' as const } },
        { vehicleModel: { contains: search, mode: 'insensitive' as const } },
        { assignedTo: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};
    return this.prisma.salesInvoice.findMany({ where, orderBy: { id: 'desc' } });
  }

  async remove(id: number) {
    return this.prisma.salesInvoice.delete({ where: { id } });
  }

  async clearAll() {
    return this.prisma.salesInvoice.deleteMany({});
  }
}
