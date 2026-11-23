import { Injectable, Logger } from '@nestjs/common';
import {
  DemoDados,
  DemoDadosSchema,
  DemoTemplate,
  obterPaletaPorTemplate,
} from '@prospect/shared';
import { EnvService } from '../../common/env/env.service.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-latest';
const REQUEST_TIMEOUT_MS = 15_000;

export interface GenerateCopyInput {
  nome: string;
  nicho: string;
  bairro?: string | null;
  template: DemoTemplate;
}

export interface GenerateCopyOutput {
  dados: DemoDados;
  geradoPorIa: boolean;
}

interface AnthropicApiResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
}

@Injectable()
export class AnthropicCopyClient {
  private readonly logger = new Logger(AnthropicCopyClient.name);

  constructor(private readonly envService: EnvService) {}

  async gerarTextosDemo(input: GenerateCopyInput): Promise<GenerateCopyOutput> {
    const apiKey = this.envService.get('ANTHROPIC_API_KEY')?.trim();
    const paleta = obterPaletaPorTemplate(input.template);

    if (!apiKey) {
      return {
        dados: this.gerarFallback(input, paleta),
        geradoPorIa: false,
      };
    }

    const local = input.bairro ? `${input.bairro}, Brasília` : 'Brasília';
    const prompt = [
      `Crie os textos de uma página de demonstração comercial em português do Brasil (com acentos, tom natural, direto, sem travessões) para o negócio abaixo:`,
      `- Nome: ${input.nome}`,
      `- Nicho: ${input.nicho} (template: ${input.template})`,
      `- Região: ${local}`,
      ``,
      `Responda APENAS com um JSON válido no formato exato:`,
      `{`,
      `  "titulo": "headline curta e atrativa (até 70 caracteres)",`,
      `  "subtitulo": "subtítulo claro focado no benefício local (até 140 caracteres)",`,
      `  "descricao": "2 parágrafos curtos apresentando o espaço e o atendimento (100 a 400 caracteres)",`,
      `  "servicos": [`,
      `    { "nome": "Serviço 1", "descricao": "descrição curta", "preco": "R$ XX" }`,
      `  ],`,
      `  "diferenciais": ["Diferencial 1", "Diferencial 2", "Diferencial 3"],`,
      `  "chamadaAcao": "texto curto do botão principal (ex.: Agendar horário)",`,
      `  "horarioFuncionamento": "Seg a Sáb, 09h às 20h"`,
      `}`,
      `Inclua exatamente 4 itens em "servicos" e 3 itens em "diferenciais".`,
    ].join('\n');

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 900,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const payload = (await response.json()) as AnthropicApiResponse;
      if (!response.ok || payload.error) {
        this.logger.warn(
          `Anthropic retornou erro (${response.status}): ${payload.error?.message ?? 'sem detalhe'}. Usando fallback.`
        );
        return { dados: this.gerarFallback(input, paleta), geradoPorIa: false };
      }

      const textBlock = payload.content?.find((c) => c.type === 'text')?.text ?? '';
      const jsonMatch = textBlock.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('Resposta do Claude sem JSON válido. Usando fallback.');
        return { dados: this.gerarFallback(input, paleta), geradoPorIa: false };
      }

      const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const parsed = DemoDadosSchema.safeParse({
        ...raw,
        corPrimaria: paleta.corPrimaria,
        corDestaque: paleta.corDestaque,
      });

      if (!parsed.success) {
        this.logger.warn('JSON do Claude fora do schema esperado. Usando fallback.');
        return { dados: this.gerarFallback(input, paleta), geradoPorIa: false };
      }

      return { dados: parsed.data, geradoPorIa: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'erro desconhecido';
      this.logger.warn(`Falha ao chamar Anthropic API (${msg}). Usando fallback.`);
      return { dados: this.gerarFallback(input, paleta), geradoPorIa: false };
    }
  }

  private gerarFallback(
    input: GenerateCopyInput,
    paleta: { corPrimaria: string; corDestaque: string }
  ): DemoDados {
    const local = input.bairro ? `em ${input.bairro}` : 'em Brasília';

    if (input.template === 'hamburgueria') {
      return {
        titulo: `${input.nome}: sabor artesanal ${local}`,
        subtitulo: `Hambúrgueres feitos na brasa, ingredientes frescos e pedido rápido direto pelo WhatsApp.`,
        descricao: `A ${input.nome} traz para ${input.bairro ?? 'Brasília'} uma experiência pensada para quem valoriza carne suculenta, pão macio e combinações marcantes. Peça para retirar no balcão ou receber quentinho em casa com atendimento direto e sem complicação.`,
        servicos: [
          {
            nome: 'Smash Clássico da Casa',
            descricao: 'Blend bovino na chapa, queijo cheddar derretido e molho especial no pão brioche.',
            preco: 'R$ 29,90',
          },
          {
            nome: 'Duplo Bacon Crocante',
            descricao: 'Dois discos artesanais, bacon em tiras, cheddar duplo e cebola caramelizada.',
            preco: 'R$ 38,90',
          },
          {
            nome: 'Combo Fritas + Refrigerante',
            descricao: 'Porção individual de batata rústica temperada e bebida gelada.',
            preco: 'R$ 16,00',
          },
          {
            nome: 'Milkshake Artesanal',
            descricao: 'Creme batido na hora nos sabores chocolate belga, morango ou ovomaltine.',
            preco: 'R$ 19,90',
          },
        ],
        diferenciais: [
          'Carne fresca moída diariamente',
          'Atendimento ágil direto no WhatsApp',
          `Entrega rápida na região de ${input.bairro ?? 'Brasília'}`,
        ],
        chamadaAcao: 'Fazer pedido agora',
        horarioFuncionamento: 'Terça a Domingo, 18h às 23h30',
        corPrimaria: paleta.corPrimaria,
        corDestaque: paleta.corDestaque,
      };
    }

    return {
      titulo: `${input.nome}: corte, barba e estilo ${local}`,
      subtitulo: `Atendimento pontual, profissionais experientes e agendamento rápido pelo WhatsApp.`,
      descricao: `Na ${input.nome}, cada detalhe foi pensado para oferecer um corte preciso, barba alinhada e um ambiente confortável ${local}. Reserve seu horário em segundos e garanta seu atendimento sem filas.`,
      servicos: [
        {
          nome: 'Corte Social ou Degradê',
          descricao: 'Corte completo na máquina e tesoura com acabamento na navalha e finalização.',
          preco: 'R$ 45,00',
        },
        {
          nome: 'Barba Completa',
          descricao: 'Alinhamento com toalha quente, espuma hidratante e óleo pós-barba.',
          preco: 'R$ 35,00',
        },
        {
          nome: 'Combo Corte + Barba',
          descricao: 'Pacote completo para sair com o visual alinhado do início ao fim.',
          preco: 'R$ 70,00',
        },
        {
          nome: 'Sobrancelha na Navalha',
          descricao: 'Limpeza rápida e natural para valorizar o desenho do rosto.',
          preco: 'R$ 15,00',
        },
      ],
      diferenciais: [
        'Agendamento rápido sem esperar na fila',
        'Ambiente climatizado e atendimento pontual',
        `Localização prática ${local}`,
      ],
      chamadaAcao: 'Agendar horário',
      horarioFuncionamento: 'Segunda a Sábado, 09h às 20h',
      corPrimaria: paleta.corPrimaria,
      corDestaque: paleta.corDestaque,
    };
  }
}
