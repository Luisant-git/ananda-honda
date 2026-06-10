import { Module } from '@nestjs/common';
import { PineLabsConfigController } from './pine-labs-config.controller';
import { PineLabsConfigService } from './pine-labs-config.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PineLabsConfigController],
  providers: [PineLabsConfigService],
  exports: [PineLabsConfigService]
})
export class PineLabsConfigModule {}
