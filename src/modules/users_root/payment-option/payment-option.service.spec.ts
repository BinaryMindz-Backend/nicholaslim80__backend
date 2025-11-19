import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodService } from './payment-option.service';

describe('PaymentOptionService', () => {
  let service: PaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodService],
    }).compile();

    service = module.get<PaymentMethodService>(PaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
