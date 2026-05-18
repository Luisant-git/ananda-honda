import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceTypeOfPartDto } from './create-service-type-of-part.dto';

export class UpdateServiceTypeOfPartDto extends PartialType(CreateServiceTypeOfPartDto) {}
