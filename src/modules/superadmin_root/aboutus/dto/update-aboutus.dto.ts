import { PartialType } from '@nestjs/swagger';
import { CreateAboutusDto } from './create-aboutus.dto';

export class UpdateAboutusDto extends PartialType(CreateAboutusDto) {}
