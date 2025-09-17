// apps/api/src/templates/templates.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { TEMPLATES_DATA } from './templates.data';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  findAll() {
    this.logger.log('Fetching all templates');
    return TEMPLATES_DATA;
  }
}
