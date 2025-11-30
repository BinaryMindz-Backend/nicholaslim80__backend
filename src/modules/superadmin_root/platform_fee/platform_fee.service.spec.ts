import { Test, TestingModule } from '@nestjs/testing';
import { PlatformFeeService } from './platform_fee.service';

describe('PlatformFeeService', () => {
  let service: PlatformFeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformFeeService],
    }).compile();

    service = module.get<PlatformFeeService>(PlatformFeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
