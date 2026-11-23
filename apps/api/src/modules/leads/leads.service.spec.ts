import { describe, expect, it, vi } from 'vitest';
import { DomainError, LeadStatus, PresencaWeb } from '@prospect/shared';
import { EventsService } from '../../events/events.service.js';
import { LeadsRepository } from './leads.repository.js';
import { LeadsService } from './leads.service.js';

describe('LeadsService', () => {
  const baseLead = {
    id: 'd0000000-0000-4000-8000-000000000001',
    placeId: 'place-1',
    nome: 'Barbearia Dom Pedro',
    nicho: 'barbearia',
    endereco: 'Rua 25 Sul, Águas Claras',
    regiaoId: 'b0000000-0000-4000-8000-000000000007',
    regiao: {
      id: 'b0000000-0000-4000-8000-000000000007',
      nome: 'Águas Claras',
      cidade: 'Brasília',
      uf: 'DF',
      lat: -15.8394,
      lng: -48.0264,
      raioMetros: 4000,
      ativa: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    telefone: '(61) 99876-5432' as string | null,
    ehCelular: true,
    website: null,
    instagram: null,
    presencaWeb: 'SEM_SITE' as PresencaWeb,
    nota: 4.8,
    totalAvaliacoes: 95,
    googleMapsUri: 'https://maps.google.com/?cid=1',
    status: 'NOVO' as LeadStatus,
    slug: null,
    proximoContatoEm: null,
    motivoPerda: null,
    observacoes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    interacoes: [],
  };

  function createService(leadOverride: Partial<typeof baseLead> | null = {}) {
    const lead = leadOverride === null ? null : { ...baseLead, ...leadOverride };

    const repository = {
      findPaginated: vi.fn(),
      findByIdWithDetails: vi.fn().mockResolvedValue(lead),
      updateStatusAndRecordInteraction: vi.fn().mockImplementation(async (params) => ({
        ...lead,
        status: params.novoStatus,
        motivoPerda: params.motivoPerda ?? null,
      })),
      recordWhatsappSent: vi.fn().mockImplementation(async (params) => ({
        ...lead,
        status: 'ENVIADO',
        proximoContatoEm: params.proximoContatoEm,
      })),
      createInteraction: vi.fn(),
    } as unknown as LeadsRepository;

    const eventsService = {
      publish: vi.fn(),
    } as unknown as EventsService;

    const service = new LeadsService(repository, eventsService);
    return { service, repository, eventsService };
  }

  it('atualiza status válido e grava interação de mudança de status', async () => {
    const { service, repository, eventsService } = createService({ status: 'RESPONDEU' });

    const updated = await service.atualizarStatus(baseLead.id, {
      status: 'PERDIDO',
      motivoPerda: 'Já contratou outro dev',
    });

    expect(updated.status).toBe('PERDIDO');
    expect(repository.updateStatusAndRecordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: baseLead.id,
        statusAnterior: 'RESPONDEU',
        novoStatus: 'PERDIDO',
        motivoPerda: 'Já contratou outro dev',
      })
    );
    expect(eventsService.publish).toHaveBeenCalledWith('leads.atualizado', {
      id: baseLead.id,
      status: 'PERDIDO',
    });
  });

  it('bloqueia transição inválida como DESCARTADO -> FECHOU', async () => {
    const { service } = createService({ status: 'DESCARTADO' });

    await expect(
      service.atualizarStatus(baseLead.id, { status: 'FECHOU' })
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('gera link wa.me, registra MENSAGEM_ENVIADA, move para ENVIADO e agenda D+3', async () => {
    const { service, repository } = createService();

    const result = await service.registrarEnvioWhatsapp(baseLead.id, {});

    expect(result.whatsappUrl).toMatch(/^https:\/\/wa\.me\/5561998765432\?text=/);
    expect(result.mensagem).toContain('Barbearia Dom Pedro');
    expect(result.lead.status).toBe('ENVIADO');

    const callArg = vi.mocked(repository.recordWhatsappSent).mock.calls[0]?.[0];
    expect(callArg?.proximoContatoEm).toBeInstanceOf(Date);
    const diffDays = Math.round(
      ((callArg?.proximoContatoEm.getTime() ?? 0) - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(3);
  });

  it('recusa envio de WhatsApp quando lead não possui telefone', async () => {
    const { service } = createService({ telefone: null });

    await expect(service.registrarEnvioWhatsapp(baseLead.id, {})).rejects.toBeInstanceOf(
      DomainError
    );
  });

  it('bloqueia envio de WhatsApp para lead DESCARTADO (LGPD)', async () => {
    const { service } = createService({ status: 'DESCARTADO' });

    await expect(service.registrarEnvioWhatsapp(baseLead.id, {})).rejects.toBeInstanceOf(
      DomainError
    );
  });
});
