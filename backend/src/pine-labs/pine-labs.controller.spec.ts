import { Test, TestingModule } from '@nestjs/testing';
import { PineLabsController } from './pine-labs.controller';

describe('PineLabsController', () => {
  let controller: PineLabsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PineLabsController],
    }).compile();

    controller = module.get<PineLabsController>(PineLabsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
