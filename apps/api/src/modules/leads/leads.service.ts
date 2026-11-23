import { Injectable } from '@nestjs/common';
import {
  AppErrorCode,
  CreateInteracaoInput,
  DomainError,
  LeadFilterQuery,
  RegistrarEnvioWhatsappInput,
  UpdateLeadStatusInput,
  assertLeadStatusTransition,
  calcularProximoContato,
  extrairDigitosTelefone,
  gerarLinkWhatsapp,
  gerarMensagemWhatsapp,
} from '@prospect/shared';
import { EventsService } from '../../events/events.service.js';
import { LeadsRepository } from './leads.repository.js';

@Injectable()
export class LeadsService {
  constructor(
    private readonly repository: LeadsRepository,
    private readonly eventsService: EventsService
  ) {}

  async listar(query: LeadFilterQuery) {
    return this.repository.findPaginated(query);
  }

  async buscarPorId(id: string) {
    const lead = await this.repository.findByIdWithDetails(id);
    if (!lead) {
      throw new DomainError('Lead não encontrado.', AppErrorCode.NOT_FOUND);
    }
    return lead;
  }

  async atualizarStatus(id: string, input: UpdateLeadStatusInput) {
    const lead = await this.buscarPorId(id);

    assertLeadStatusTransition(lead.status, input.status);

    const partesConteudo = [`Status alterado de ${lead.status} para ${input.status}`];
    if (input.motivoPerda) {
      partesConteudo.push(`Motivo: ${input.motivoPerda}`);
    }

    const updated = await this.repository.updateStatusAndRecordInteraction({
      id,
      statusAnterior: lead.status,
      novoStatus: input.status,
      motivoPerda: input.motivoPerda,
      observacoes: input.observacoes,
      conteudoInteracao: partesConteudo.join(' | '),
    });

    this.eventsService.publish('leads.atualizado', {
      id: updated.id,
      status: updated.status,
    });

    return updated;
  }

  async registrarEnvioWhatsapp(id: string, input: RegistrarEnvioWhatsappInput) {
    const lead = await this.buscarPorId(id);

    assertLeadStatusTransition(lead.status, 'ENVIADO');

    if (!lead.telefone || extrairDigitosTelefone(lead.telefone).length < 10) {
      throw new DomainError(
        'Este lead não possui um número de telefone válido para WhatsApp.',
        AppErrorCode.BAD_REQUEST
      );
    }

    const mensagem =
      input.mensagem?.trim() ||
      gerarMensagemWhatsapp({
        nome: lead.nome,
        bairro: lead.regiao?.nome,
      });

    const whatsappUrl = gerarLinkWhatsapp(lead.telefone, mensagem);
    const proximoContatoEm = calcularProximoContato(new Date(), 3);

    const updated = await this.repository.recordWhatsappSent({
      id: lead.id,
      proximoContatoEm,
      mensagem,
    });

    this.eventsService.publish('leads.atualizado', {
      id: updated.id,
      status: updated.status,
    });

    return {
      lead: updated,
      whatsappUrl,
      mensagem,
    };
  }

  async adicionarInteracao(id: string, input: CreateInteracaoInput) {
    await this.buscarPorId(id);

    return this.repository.createInteraction({
      leadId: id,
      tipo: input.tipo,
      conteudo: input.conteudo,
    });
  }
}
