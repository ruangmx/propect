import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AppErrorCode, CreateBuscaSchema, DomainError } from '@prospect/shared';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor.js';
import { BuscasService } from './buscas.service.js';

@ApiTags('Buscas')
@Controller('buscas')
export class BuscasController {
  constructor(private readonly buscasService: BuscasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as buscas recentes realizadas no Google Places' })
  async listarRecentes() {
    return this.buscasService.listarRecentes();
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Executa uma nova busca de leads por nicho e regiões no Google Places API (New)',
  })
  async executar(@Body() body: unknown) {
    const parsed = CreateBuscaSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para iniciar a busca.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.buscasService.executarBusca(parsed.data);
  }
}
