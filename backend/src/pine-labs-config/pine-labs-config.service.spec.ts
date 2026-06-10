import { Test, TestingModule } from '@nestjs/testing';
import { PineLabsConfigService } from './pine-labs-config.service';

describe('PineLabsConfigService', () => {
  let service: PineLabsConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PineLabsConfigService],
    }).compile();

    service = module.get<PineLabsConfigService>(PineLabsConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
