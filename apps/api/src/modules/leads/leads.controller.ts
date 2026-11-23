import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AppErrorCode,
  CreateInteracaoSchema,
  DomainError,
  LeadFilterQuerySchema,
  RegistrarEnvioWhatsappSchema,
  UpdateLeadStatusSchema,
} from '@prospect/shared';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor.js';
import { LeadsService } from './leads.service.js';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista leads com paginação e filtros por status, nicho, região e presença web' })
  async listar(@Query() query: unknown) {
    const parsed = LeadFilterQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new DomainError(
        'Parâmetros de filtro inválidos.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.leadsService.listar(parsed.data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de um lead e seu histórico de interações' })
  async buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.buscarPorId(id);
  }

  @Patch(':id/status')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Atualiza o status do lead no funil e registra interação de mudança' })
  async atualizarStatus(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = UpdateLeadStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para atualizar o status.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.leadsService.atualizarStatus(id, parsed.data);
  }

  @Post(':id/whatsapp')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Gera link wa.me, registra interação MENSAGEM_ENVIADA, move para ENVIADO e agenda D+3',
  })
  async registrarEnvioWhatsapp(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = RegistrarEnvioWhatsappSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para envio de WhatsApp.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.leadsService.registrarEnvioWhatsapp(id, parsed.data);
  }

  @Post(':id/interacoes')
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Registra uma interação manual no histórico do lead' })
  async adicionarInteracao(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const parsed = CreateInteracaoSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(
        'Dados inválidos para registrar a interação.',
        AppErrorCode.BAD_REQUEST,
        parsed.error.flatten()
      );
    }

    return this.leadsService.adicionarInteracao(id, parsed.data);
  }
}
