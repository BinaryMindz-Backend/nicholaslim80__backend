import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryTypeController } from './delivery-type.controller';
import { DeliveryTypeService } from './delivery-type.service';

describe('DeliveryTypeController', () => {
  let controller: DeliveryTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryTypeController],
      providers: [DeliveryTypeService],
    }).compile();

    controller = module.get<DeliveryTypeController>(DeliveryTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
