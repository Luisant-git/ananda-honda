import { Module } from '@nestjs/common';
import { TypeOfCollectionService } from './type-of-collection.service';
import { TypeOfCollectionController } from './type-of-collection.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeOfCollectionController],
  providers: [TypeOfCollectionService],
})
export class TypeOfCollectionModule {}