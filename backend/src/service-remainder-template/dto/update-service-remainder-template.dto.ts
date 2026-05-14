import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceRemainderTemplateDto } from './create-service-remainder-template.dto';

export class UpdateServiceRemainderTemplateDto extends PartialType(CreateServiceRemainderTemplateDto) {}
