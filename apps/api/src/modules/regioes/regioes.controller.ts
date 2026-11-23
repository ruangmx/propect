import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegioesService } from './regioes.service.js';

@ApiTags('Regiões')
@Controller('regioes')
export class RegioesController {
  constructor(private readonly regioesService: RegioesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as regiões ativas disponíveis para prospecção' })
  async listar() {
    return this.regioesService.listarAtivas();
  }
}
