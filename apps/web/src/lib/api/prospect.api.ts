import {
  Busca,
  CreateBuscaInput,
  CreateBuscaResult,
  CreateInteracaoInput,
  Demo,
  GenerateDemoInput,
  Interacao,
  Lead,
  LeadFilterQuery,
  PaginatedResponse,
  PublicDemoResponse,
  Regiao,
  RegistrarEnvioWhatsappInput,
  RegistrarEnvioWhatsappResult,
  UpdateDemoInput,
  UpdateLeadStatusInput,
} from '@prospect/shared';
import { apiClient } from '../api-client';

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function listarRegioes(): Promise<Regiao[]> {
  return apiClient<Regiao[]>('/regioes');
}

export async function listarBuscasRecentes(): Promise<Busca[]> {
  return apiClient<Busca[]>('/buscas');
}

export async function executarBusca(input: CreateBuscaInput): Promise<CreateBuscaResult> {
  return apiClient<CreateBuscaResult>('/buscas', {
    method: 'POST',
    headers: {
      'Idempotency-Key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function listarLeads(
  query: Partial<LeadFilterQuery> = {}
): Promise<PaginatedResponse<Lead>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.nicho) params.set('nicho', query.nicho);
  if (query.regiaoId) params.set('regiaoId', query.regiaoId);
  if (query.presencaWeb) params.set('presencaWeb', query.presencaWeb);
  if (query.search) params.set('search', query.search);

  const qs = params.toString();
  return apiClient<PaginatedResponse<Lead>>(`/leads${qs ? `?${qs}` : ''}`);
}

export async function buscarLeadPorId(id: string): Promise<Lead> {
  return apiClient<Lead>(`/leads/${id}`);
}

export async function atualizarStatusLead(
  id: string,
  input: UpdateLeadStatusInput
): Promise<Lead> {
  return apiClient<Lead>(`/leads/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Idempotency-Key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function enviarWhatsappLead(
  id: string,
  input: RegistrarEnvioWhatsappInput = {}
): Promise<RegistrarEnvioWhatsappResult> {
  return apiClient<RegistrarEnvioWhatsappResult>(`/leads/${id}/whatsapp`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function adicionarInteracaoLead(
  id: string,
  input: CreateInteracaoInput
): Promise<Interacao> {
  return apiClient<Interacao>(`/leads/${id}/interacoes`, {
    method: 'POST',
    headers: {
      'Idempotency-Key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function gerarDemoLead(
  leadId: string,
  input: GenerateDemoInput = {}
): Promise<{ demo: Demo; lead: Lead; demoUrl: string; geradoPorIa: boolean }> {
  return apiClient<{ demo: Demo; lead: Lead; demoUrl: string; geradoPorIa: boolean }>(
    `/leads/${leadId}/demo`,
    {
      method: 'POST',
      headers: {
        'Idempotency-Key': createIdempotencyKey(),
      },
      body: JSON.stringify(input),
    }
  );
}

export async function atualizarDemo(
  demoId: string,
  input: UpdateDemoInput
): Promise<Demo> {
  return apiClient<Demo>(`/demos/${demoId}`, {
    method: 'PATCH',
    headers: {
      'Idempotency-Key': createIdempotencyKey(),
    },
    body: JSON.stringify(input),
  });
}

export async function obterDemoPublica(slug: string): Promise<PublicDemoResponse> {
  return apiClient<PublicDemoResponse>(`/demos/public/${encodeURIComponent(slug)}`);
}
