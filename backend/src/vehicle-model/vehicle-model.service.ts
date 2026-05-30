import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

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
      // Find the first non-empty column value, assuming it's the model name, or a specific column like "Vehicle Model" / "Model"
      const modelName = String(row['Vehicle Model'] || row['Model'] || row['model'] || row['vehicle_model'] || row['VehicleModel'] || row[Object.keys(row)[0]] || '').trim();
      
      if (!modelName) continue;
      
      const existing = await this.prisma.vehicleModel.findFirst({
        where: {
          model: { equals: modelName, mode: 'insensitive' }
        }
      });
      
      if (!existing) {
        await this.prisma.vehicleModel.create({
          data: {
            model: modelName,
            status: 'Enable'
          }
        });
        importedCount++;
      }
    }

    return { imported: importedCount, message: `Successfully imported ${importedCount} vehicle models.` };
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