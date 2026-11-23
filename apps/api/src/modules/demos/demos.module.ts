import { Module } from '@nestjs/common';
import { AnthropicCopyClient } from './anthropic-copy.client.js';
import { DemosController } from './demos.controller.js';
import { DemosRepository } from './demos.repository.js';
import { DemosService } from './demos.service.js';

@Module({
  controllers: [DemosController],
  providers: [AnthropicCopyClient, DemosRepository, DemosService],
  exports: [DemosService],
})
export class DemosModule {}
