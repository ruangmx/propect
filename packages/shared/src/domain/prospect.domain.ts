import { AllowedTransitionsMap, assertTransition, canTransition } from './state-machine.js';
import type { LeadStatus } from '../schemas/prospect.schema.js';

const REDES = /instagram\.com|facebook\.com|linktr\.ee|wa\.me|ifood/i;

export interface PlaceClassificationInput {
  businessStatus?: string | null;
  websiteUri?: string | null;
}

export type ResultadoClassificacao = 'SEM_SITE' | 'SO_REDE_SOCIAL' | 'TEM_SITE' | 'DESCARTAR';

/**
 * Classifica um negócio retornado pela Google Places API quanto à sua operação e presença web.
 */
export function classificar(p: PlaceClassificationInput): ResultadoClassificacao {
  if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') return 'DESCARTAR';
  if (!p.websiteUri) return 'SEM_SITE';
  if (REDES.test(p.websiteUri)) return 'SO_REDE_SOCIAL';
  return 'TEM_SITE';
}

/**
 * Verifica se o telefone nacional brasileiro está no formato de celular com 9º dígito: (DD) 9XXXX-XXXX.
 */
export const ehCelular = (tel?: string | null): boolean =>
  !!tel && /\(\d{2}\)\s?9\d{4}-\d{4}/.test(tel);

/**
 * Extrai apenas os dígitos do número de telefone, removendo o DDI 55 caso já esteja presente.
 */
export function extrairDigitosTelefone(tel?: string | null): string {
  if (!tel) return '';
  const digitos = tel.replace(/\D/g, '');
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    return digitos.slice(2);
  }
  return digitos;
}

/**
 * Valida que uma URL externa usa estritamente protocolo https: (previne XSS via javascript:/data:).
 */
export function sanitizeHttpsUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extrai a URL segura do Instagram caso o websiteUri aponte para instagram.com em HTTPS.
 */
export function extrairInstagram(websiteUri?: string | null): string | null {
  const safeUrl = sanitizeHttpsUrl(websiteUri);
  if (!safeUrl) return null;
  const hostname = new URL(safeUrl).hostname.toLowerCase();
  if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
    return safeUrl;
  }
  return null;
}

export interface MensagemWhatsappParams {
  nome: string;
  bairro?: string | null;
  linkDemo?: string | null;
}

/**
 * Monta a mensagem natural de primeira abordagem no WhatsApp conforme o PLANO.md.
 */
export function gerarMensagemWhatsapp(params: MensagemWhatsappParams): string {
  const nomeLimpo = params.nome.trim();
  const trechoBairro = params.bairro ? ` aí em ${params.bairro.trim()}` : '';

  if (params.linkDemo) {
    return (
      `Oi, tudo bem? Aqui é o Ruan, sou desenvolvedor aqui de Brasília. ` +
      `Vi a ${nomeLimpo}${trechoBairro} no Google e montei uma prévia de como poderia ficar um site de vocês: ${params.linkDemo}\n` +
      `Fiz sem compromisso, só pra vocês verem. Se curtirem, posso colocar a logo e ajustar do jeito de vocês.`
    );
  }

  return (
    `Oi, tudo bem? Aqui é o Ruan, sou desenvolvedor aqui de Brasília. ` +
    `Vi a ${nomeLimpo}${trechoBairro} no Google e notei que vocês ainda não têm um site próprio.\n` +
    `Posso montar uma prévia sem compromisso pra vocês verem como ficaria com a identidade de vocês?`
  );
}

/**
 * Gera o link oficial wa.me com DDI 55 e texto codificado.
 */
export function gerarLinkWhatsapp(telefone: string, mensagem: string): string {
  const numeroSoDigitos = extrairDigitosTelefone(telefone);
  return `https://wa.me/55${numeroSoDigitos}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Calcula a data do próximo contato somando `dias` (padrão D+3).
 */
export function calcularProximoContato(dataBase: Date = new Date(), dias = 3): Date {
  const proximo = new Date(dataBase.getTime());
  proximo.setUTCDate(proximo.getUTCDate() + dias);
  return proximo;
}

/**
 * Mapa de transições permitidas no funil de prospecção.
 * Um lead DESCARTADO (ex.: LGPD / não quer contato) só pode retornar para NOVO
 * mediante revisão explícita, nunca pular diretamente para abordagens ou fechamento.
 */
export const LEAD_ALLOWED_TRANSITIONS: AllowedTransitionsMap<LeadStatus> = {
  NOVO: ['LIGAR', 'DEMO_PRONTA', 'ENVIADO', 'RESPONDEU', 'DESCARTADO'],
  LIGAR: ['NOVO', 'DEMO_PRONTA', 'ENVIADO', 'RESPONDEU', 'REUNIAO', 'PERDIDO', 'SEM_RESPOSTA', 'DESCARTADO'],
  DEMO_PRONTA: ['NOVO', 'ENVIADO', 'RESPONDEU', 'DESCARTADO'],
  ENVIADO: ['RESPONDEU', 'REUNIAO', 'FECHOU', 'PERDIDO', 'SEM_RESPOSTA', 'DESCARTADO'],
  RESPONDEU: ['REUNIAO', 'FECHOU', 'PERDIDO', 'DESCARTADO'],
  REUNIAO: ['FECHOU', 'PERDIDO', 'RESPONDEU', 'DESCARTADO'],
  FECHOU: ['REUNIAO'],
  PERDIDO: ['NOVO', 'RESPONDEU', 'REUNIAO', 'DESCARTADO'],
  SEM_RESPOSTA: ['NOVO', 'ENVIADO', 'RESPONDEU', 'DESCARTADO'],
  DESCARTADO: ['NOVO'],
};

export function canTransitionLeadStatus(from: LeadStatus, to: LeadStatus): boolean {
  return canTransition(from, to, LEAD_ALLOWED_TRANSITIONS);
}

export function assertLeadStatusTransition(from: LeadStatus, to: LeadStatus): void {
  assertTransition(from, to, LEAD_ALLOWED_TRANSITIONS, 'Lead');
}
