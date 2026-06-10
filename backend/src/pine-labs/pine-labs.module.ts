import { Module } from '@nestjs/common';
import { PineLabsController } from './pine-labs.controller';
import { PineLabsService } from './pine-labs.service';

import { PineLabsConfigModule } from '../pine-labs-config/pine-labs-config.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PineLabsConfigModule, PrismaModule],
  controllers: [PineLabsController],
  providers: [PineLabsService]
})
export class PineLabsModule {}
