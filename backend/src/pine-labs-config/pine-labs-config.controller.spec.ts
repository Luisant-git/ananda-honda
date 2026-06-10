import { Test, TestingModule } from '@nestjs/testing';
import { PineLabsConfigController } from './pine-labs-config.controller';

describe('PineLabsConfigController', () => {
  let controller: PineLabsConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PineLabsConfigController],
    }).compile();

    controller = module.get<PineLabsConfigController>(PineLabsConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
