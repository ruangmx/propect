import { Injectable } from '@nestjs/common';
import {
  AppErrorCode,
  DemoDadosSchema,
  DemoTemplate,
  DomainError,
  GenerateDemoInput,
  PublicDemoResponse,
  UpdateDemoInput,
  assertLeadStatusTransition,
  buildDemoUrl,
  gerarSlugDemo,
  resolverTemplateDemo,
  sanitizeHttpsUrl,
} from '@prospect/shared';
import { EnvService } from '../../common/env/env.service.js';
import { EventsService } from '../../events/events.service.js';
import { AnthropicCopyClient } from './anthropic-copy.client.js';
import { DemosRepository } from './demos.repository.js';

@Injectable()
export class DemosService {
  constructor(
    private readonly repository: DemosRepository,
    private readonly anthropicClient: AnthropicCopyClient,
    private readonly envService: EnvService,
    private readonly eventsService: EventsService
  ) {}

  async gerarParaLead(leadId: string, input: GenerateDemoInput = {}) {
    const lead = await this.repository.findLeadForDemo(leadId);
    if (!lead) {
      throw new DomainError('Lead não encontrado.', AppErrorCode.NOT_FOUND);
    }

    assertLeadStatusTransition(lead.status, 'DEMO_PRONTA');

    const template: DemoTemplate = input.template ?? resolverTemplateDemo(lead.nicho);
    const { dados, geradoPorIa } = await this.anthropicClient.gerarTextosDemo({
      nome: lead.nome,
      nicho: lead.nicho,
      bairro: lead.regiao?.nome,
      template,
    });

    const slug = await this.garantirSlugUnico(lead.nome, lead.id, lead.slug);

    const { demo, lead: updatedLead } = await this.repository.saveGeneratedDemoAndUpdateLead({
      leadId: lead.id,
      slug,
      template,
      dados,
      statusAnterior: lead.status,
    });

    const baseUrl = this.envService.get('DEMO_BASE_URL');
    const demoUrl = buildDemoUrl(baseUrl, slug);

    this.eventsService.publish('demos.gerada', {
      leadId: lead.id,
      demoId: demo.id,
      slug,
      geradoPorIa,
    });

    return {
      demo,
      lead: updatedLead,
      demoUrl,
      geradoPorIa,
    };
  }

  async atualizarDemo(id: string, input: UpdateDemoInput) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new DomainError('Demo não encontrada.', AppErrorCode.NOT_FOUND);
    }

    return this.repository.updateDemo(id, input);
  }

  async obterPublicaPorSlug(slug: string): Promise<PublicDemoResponse> {
    const result = await this.repository.findPublicBySlugAndIncrementViews(slug);
    if (!result) {
      throw new DomainError('Demonstração não encontrada.', AppErrorCode.NOT_FOUND);
    }

    const { lead, demo } = result;
    const dadosParsed = DemoDadosSchema.safeParse(demo.dados);
    if (!dadosParsed.success) {
      // Conteúdo salvo corrompido: nunca vaza detalhes do schema na rota pública.
      throw new DomainError('Demonstração indisponível.', AppErrorCode.NOT_FOUND);
    }
    const template: DemoTemplate =
      demo.template === 'hamburgueria' ? 'hamburgueria' : 'barbearia';

    return {
      slug: lead.slug ?? slug,
      template,
      dados: dadosParsed.data,
      logoUrl: sanitizeHttpsUrl(demo.logoUrl),
      negocio: {
        nome: lead.nome,
        nicho: lead.nicho,
        endereco: lead.endereco,
        bairro: lead.regiao?.nome ?? null,
        telefone: lead.telefone,
        googleMapsUri: sanitizeHttpsUrl(lead.googleMapsUri),
        instagram: sanitizeHttpsUrl(lead.instagram),
        nota: lead.nota,
        totalAvaliacoes: lead.totalAvaliacoes,
      },
    };
  }

  private async garantirSlugUnico(
    nome: string,
    leadId: string,
    slugAtual?: string | null
  ): Promise<string> {
    if (slugAtual) return slugAtual;

    // Sufixo derivado do id do lead: o slug não é adivinhável só pelo nome do negócio.
    const comSufixo = gerarSlugDemo(nome, leadId.replace(/-/g, '').slice(0, 8));
    if (await this.repository.slugExists(comSufixo, leadId)) {
      throw new DomainError('Não foi possível gerar um endereço único para a demo.', AppErrorCode.CONFLICT);
    }
    return comSufixo;
  }
}
