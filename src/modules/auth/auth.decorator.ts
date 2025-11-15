// auth/auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt.guard';


export function Auth() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
