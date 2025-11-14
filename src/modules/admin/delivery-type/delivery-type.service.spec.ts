import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryTypeService } from './delivery-type.service';

describe('DeliveryTypeService', () => {
  let service: DeliveryTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryTypeService],
    }).compile();

    service = module.get<DeliveryTypeService>(DeliveryTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
