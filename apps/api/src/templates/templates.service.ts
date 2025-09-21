import { Injectable, Logger } from '@nestjs/common';
import { TEMPLATES_DATA } from './templates.data';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  findAll() {
    this.logger.log('TemplatesService.findAll called (cache missed)');
    return TEMPLATES_DATA;
  }
}
