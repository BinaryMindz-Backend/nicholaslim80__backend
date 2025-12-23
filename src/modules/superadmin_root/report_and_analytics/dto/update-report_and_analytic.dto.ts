import { PartialType } from '@nestjs/swagger';
import { CreateReportAndAnalyticDto } from './create-report_and_analytic.dto';

export class UpdateReportAndAnalyticDto extends PartialType(CreateReportAndAnalyticDto) {}
