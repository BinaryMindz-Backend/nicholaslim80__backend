import { PartialType } from '@nestjs/swagger';
import { CreatePaymentMethodDto } from './create-payment-option.dto';


export class UpdatePaymentMethodDto extends PartialType(CreatePaymentMethodDto) {}
