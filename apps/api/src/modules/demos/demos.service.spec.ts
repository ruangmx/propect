import { describe, expect, it, vi } from 'vitest';
import { DomainError, LeadStatus } from '@prospect/shared';
import { EnvService } from '../../common/env/env.service.js';
import { EventsService } from '../../events/events.service.js';
import { AnthropicCopyClient } from './anthropic-copy.client.js';
import { DemosRepository } from './demos.repository.js';
import { DemosService } from './demos.service.js';

describe('DemosService', () => {
  const baseDados = {
    titulo: 'Barbearia Dom Pedro em Águas Claras',
    subtitulo: 'Corte, barba e atendimento pontual',
    descricao: 'Espaço pensado para oferecer um corte preciso e atendimento rápido.',
    servicos: [{ nome: 'Corte Degradê', descricao: 'Acabamento na navalha', preco: 'R$ 45' }],
    diferenciais: ['Sem fila', 'Ambiente climatizado', 'Fácil acesso'],
    chamadaAcao: 'Agendar horário',
    horarioFuncionamento: 'Seg a Sáb, 09h às 20h',
    corPrimaria: '#111827',
    corDestaque: '#d97706',
  };

  function createService(leadStatus: LeadStatus = 'NOVO') {
    const lead = {
      id: 'd0000000-0000-4000-8000-000000000001',
      nome: 'Barbearia Dom Pedro',
      nicho: 'barbearia',
      endereco: 'Rua 25 Sul, Águas Claras',
      telefone: '(61) 99876-5432',
      googleMapsUri: 'https://maps.google.com/?cid=1',
      instagram: null,
      nota: 4.8,
      totalAvaliacoes: 100,
      status: leadStatus,
      slug: null as string | null,
      regiao: { nome: 'Águas Claras' },
      demo: null,
    };

    const repository = {
      findLeadForDemo: vi.fn().mockResolvedValue(lead),
      slugExists: vi.fn().mockResolvedValue(false),
      saveGeneratedDemoAndUpdateLead: vi.fn().mockImplementation(async (params) => ({
        demo: {
          id: 'e0000000-0000-4000-8000-000000000001',
          leadId: params.leadId,
          template: params.template,
          dados: params.dados,
          logoUrl: null,
          publicadaEm: new Date(),
          visualizacoes: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        lead: {
          ...lead,
          slug: params.slug,
          status: 'DEMO_PRONTA',
        },
      })),
      findById: vi.fn(),
      updateDemo: vi.fn(),
      findPublicBySlugAndIncrementViews: vi.fn().mockResolvedValue({
        lead: { ...lead, slug: 'barbearia-dom-pedro' },
        demo: {
          id: 'e0000000-0000-4000-8000-000000000001',
          template: 'barbearia',
          dados: baseDados,
          logoUrl: 'https://cdn.exemplo.com/logo.png',
          visualizacoes: 3,
        },
      }),
    } as unknown as DemosRepository;

    const anthropicClient = {
      gerarTextosDemo: vi.fn().mockResolvedValue({
        dados: baseDados,
        geradoPorIa: false,
      }),
    } as unknown as AnthropicCopyClient;

    const envService = {
      get: vi.fn().mockReturnValue('http://localhost:3000'),
    } as unknown as EnvService;

    const eventsService = {
      publish: vi.fn(),
    } as unknown as EventsService;

    const service = new DemosService(repository, anthropicClient, envService, eventsService);
    return { service, repository, eventsService };
  }

  it('gera demo, cria slug, muda status para DEMO_PRONTA e publica evento', async () => {
    const { service, eventsService } = createService('NOVO');

    const result = await service.gerarParaLead('d0000000-0000-4000-8000-000000000001', {});

    expect(result.lead.status).toBe('DEMO_PRONTA');
    expect(result.lead.slug).toMatch(/^barbearia-dom-pedro-d0000000$/);
    expect(result.demoUrl).toBe(`http://localhost:3000/demo/${result.lead.slug}`);
    expect(eventsService.publish).toHaveBeenCalledWith(
      'demos.gerada',
      expect.objectContaining({ slug: 'barbearia-dom-pedro-d0000000' })
    );
  });

  it('bloqueia geração de demo para lead DESCARTADO (LGPD)', async () => {
    const { service } = createService('DESCARTADO');

    await expect(
      service.gerarParaLead('d0000000-0000-4000-8000-000000000001', {})
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('retorna demo pública com contador de visualizações incrementado', async () => {
    const { service } = createService();

    const pub = await service.obterPublicaPorSlug('barbearia-dom-pedro');

    expect(pub.slug).toBe('barbearia-dom-pedro');
    expect(pub.logoUrl).toBe('https://cdn.exemplo.com/logo.png');
    expect(pub.negocio.nome).toBe('Barbearia Dom Pedro');
    expect(pub).not.toHaveProperty('visualizacoes');
  });
});
