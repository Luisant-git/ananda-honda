import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async create(data: { regionname: string; divisionname: string; officename: string; pincode: string; district: string; statename: string }) {
    return this.prisma.location.create({
      data
    });
  }

  async findAll() {
    return this.prisma.location.findMany({
      orderBy: { id: 'desc' }
    });
  }

  async uploadFile(buffer: Buffer) {
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      workbook = XLSX.read(buffer.toString(), { type: 'string' });
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) throw new BadRequestException('Excel file is empty');

    let importedCount = 0;
    
    for (const row of rows) {
      const getVal = (key: string) => {
         const k = Object.keys(row).find(x => x.replace(/\s+/g, '').toLowerCase() === key.replace(/\s+/g, '').toLowerCase());
         return k ? row[k] : undefined;
      };

      const regionname = String(getVal('regionname') || getVal('region') || '').trim();
      const divisionname = String(getVal('divisionname') || getVal('division') || '').trim();
      const officename = String(getVal('officename') || getVal('office') || '').trim();
      const pincode = String(getVal('pincode') || '').trim();
      const district = String(getVal('district') || '').trim();
      const statename = String(getVal('statename') || getVal('state') || '').trim();

      if (!officename || !pincode) continue; // Office name and pincode are minimum requirements

      // We don't have a unique constraint, but maybe we can check by officename and pincode
      const existing = await this.prisma.location.findFirst({
        where: {
          officename: { equals: officename, mode: 'insensitive' },
          pincode: { equals: pincode, mode: 'insensitive' }
        }
      });
      
      if (!existing) {
        await this.prisma.location.create({
          data: {
            regionname,
            divisionname,
            officename,
            pincode,
            district,
            statename
          }
        });
        importedCount++;
      } else {
        await this.prisma.location.update({
          where: { id: existing.id },
          data: {
            regionname,
            divisionname,
            district,
            statename
          }
        });
        importedCount++;
      }
    }

    return { imported: importedCount, message: `Successfully imported ${importedCount} locations.` };
  }

  async findOne(id: number) {
    return this.prisma.location.findUnique({
      where: { id }
    });
  }

  async update(id: number, data: { regionname?: string; divisionname?: string; officename?: string; pincode?: string; district?: string; statename?: string }) {
    return this.prisma.location.update({
      where: { id },
      data
    });
  }

  async remove(id: number) {
    return this.prisma.location.delete({
      where: { id }
    });
  }
}
