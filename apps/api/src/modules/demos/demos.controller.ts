import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AppErrorCode,
  DomainError,
  GenerateDemoInputSchema,
  UpdateDemoSchema,
} from '@prospect/shared';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor.js';
import { DemosService } from './demos.service.js';

@ApiTags('Demos')
@Controller()
export class DemosController {
  constructor(private readonly demosService: DemosService) {}

  @Post('leads/:id/demo')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Gera a página de demonstração do lead com textos de nicho e move status para DEMO_PRONTA',
  })
  async gerarParaLead(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = GenerateDemoInputSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para geração da demo.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.demosService.gerarParaLead(id, parsed.data);
  }

  @Patch('demos/:id')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Atualiza textos, paleta ou logoUrl opcional da demo antes do envio' })
  async atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = UpdateDemoSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para atualizar a demo.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.demosService.atualizarDemo(id, parsed.data);
  }

  @Get('demos/public/:slug')
  @ApiOperation({
    summary: 'Retorna os dados públicos da demo por slug e incrementa o contador de visualizações',
  })
  async obterPublica(@Param('slug') slug: string) {
    return this.demosService.obterPublicaPorSlug(slug);
  }
}
