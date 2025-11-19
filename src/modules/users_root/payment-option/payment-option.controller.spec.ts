import { Test, TestingModule } from '@nestjs/testing';
import { PaymentOptionController } from './payment-option.controller';
import { PaymentOptionService } from './payment-option.service';

describe('PaymentOptionController', () => {
  let controller: PaymentOptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentOptionController],
      providers: [PaymentOptionService],
    }).compile();

    controller = module.get<PaymentOptionController>(PaymentOptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
