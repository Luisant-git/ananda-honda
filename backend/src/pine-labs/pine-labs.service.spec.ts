import { Test, TestingModule } from '@nestjs/testing';
import { PineLabsService } from './pine-labs.service';

describe('PineLabsService', () => {
  let service: PineLabsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PineLabsService],
    }).compile();

    service = module.get<PineLabsService>(PineLabsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
