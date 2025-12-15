import { PartialType } from '@nestjs/swagger';
import { CreateCustomerOrderConfirmationDto } from './create-customer_order_confirmation.dto';

export class UpdateCustomerOrderConfirmationDto extends PartialType(CreateCustomerOrderConfirmationDto) {}
