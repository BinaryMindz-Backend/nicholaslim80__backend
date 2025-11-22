import { Test, TestingModule } from '@nestjs/testing';
import { IncentiveController } from './incentive.controller';
import { IncentiveService } from './incentive.service';

describe('IncentiveController', () => {
  let controller: IncentiveController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncentiveController],
      providers: [IncentiveService],
    }).compile();

    controller = module.get<IncentiveController>(IncentiveController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
