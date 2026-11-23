'use client';

import { useEffect, useState } from 'react';
import {
  Lead,
  LeadStatus,
  LEAD_ALLOWED_TRANSITIONS,
  TipoInteracao,
  canTransitionLeadStatus,
  sanitizeHttpsUrl,
} from '@prospect/shared';
import {
  ExternalLink,
  MessageCircle,
  Phone,
  X,
  Clock,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LeadDetailModalProps {
  lead: Lead;
  isBusy: boolean;
  onClose: () => void;
  onSendWhatsapp: (leadId: string) => void;
  onChangeStatus: (leadId: string, status: LeadStatus, motivoPerda?: string) => void;
  onAddInteraction: (leadId: string, tipo: TipoInteracao, conteudo: string) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: 'Novo',
  LIGAR: 'Ligar',
  DEMO_PRONTA: 'Demo pronta',
  ENVIADO: 'Enviado',
  RESPONDEU: 'Respondeu',
  REUNIAO: 'Reunião',
  FECHOU: 'Fechou',
  PERDIDO: 'Perdido',
  SEM_RESPOSTA: 'Sem resposta',
  DESCARTADO: 'Descartado',
};

const INTERACAO_LABELS: Record<TipoInteracao, string> = {
  MENSAGEM_ENVIADA: 'WhatsApp enviado',
  FOLLOW_UP: 'Follow-up',
  RESPOSTA: 'Resposta do lead',
  LIGACAO: 'Ligação',
  REUNIAO: 'Reunião',
  MUDANCA_STATUS: 'Mudança de status',
  NOTA: 'Nota',
};

export function LeadDetailModal({
  lead,
  isBusy,
  onClose,
  onSendWhatsapp,
  onChangeStatus,
  onAddInteraction,
}: LeadDetailModalProps) {
  const [novoStatus, setNovoStatus] = useState<LeadStatus>(lead.status);
  const [motivoPerda, setMotivoPerda] = useState(lead.motivoPerda ?? '');
  const [tipoInteracao, setTipoInteracao] = useState<TipoInteracao>('NOTA');
  const [conteudoInteracao, setConteudoInteracao] = useState('');

  useEffect(() => {
    setNovoStatus(lead.status);
    setMotivoPerda(lead.motivoPerda ?? '');
  }, [lead.id, lead.status, lead.motivoPerda]);

  const transicoes = LEAD_ALLOWED_TRANSITIONS[lead.status] ?? [];
  const precisaMotivo = novoStatus === 'PERDIDO' || novoStatus === 'DESCARTADO';
  const podeEnviarWhatsapp = Boolean(lead.telefone) && canTransitionLeadStatus(lead.status, 'ENVIADO');
  const mapsUrl = sanitizeHttpsUrl(lead.googleMapsUri);
  const instagramUrl = sanitizeHttpsUrl(lead.instagram);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-detail-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="lead-detail-title" className="text-xl font-bold text-white">
                {lead.nome}
              </h2>
              <Badge variant="default">{STATUS_LABELS[lead.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              {lead.nicho} · {lead.regiao?.nome ?? 'Brasília'}
            </p>
            {lead.endereco && (
              <p className="mt-1 text-xs text-zinc-500">{lead.endereco}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do lead"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lead.telefone && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200">
              <Phone className="h-4 w-4 text-zinc-400" />
              {lead.telefone}
            </span>
          )}
          <Button
            type="button"
            size="sm"
            disabled={isBusy || !podeEnviarWhatsapp}
            onClick={() => onSendWhatsapp(lead.id)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar no WhatsApp
          </Button>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir no Maps
            </a>
          )}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Instagram
            </a>
          )}
        </div>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Alterar status no funil</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as LeadStatus)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            >
              <option value={lead.status}>{STATUS_LABELS[lead.status]} (atual)</option>
              {transicoes.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={isBusy || novoStatus === lead.status}
              onClick={() =>
                onChangeStatus(lead.id, novoStatus, motivoPerda.trim() || undefined)
              }
            >
              Salvar status
            </Button>
          </div>
          {precisaMotivo && (
            <Input
              placeholder="Motivo da perda ou descarte (ex.: não quer contato, já tem site)"
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value)}
            />
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Histórico de interações</h3>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!conteudoInteracao.trim()) return;
              onAddInteraction(lead.id, tipoInteracao, conteudoInteracao.trim());
              setConteudoInteracao('');
            }}
          >
            <select
              value={tipoInteracao}
              onChange={(e) => setTipoInteracao(e.target.value as TipoInteracao)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="NOTA">Nota</option>
              <option value="LIGACAO">Ligação</option>
              <option value="RESPOSTA">Resposta</option>
              <option value="REUNIAO">Reunião</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
            <Input
              placeholder="Registrar anotação, resumo da ligação ou resposta..."
              value={conteudoInteracao}
              onChange={(e) => setConteudoInteracao(e.target.value)}
            />
            <Button type="submit" disabled={isBusy || !conteudoInteracao.trim()} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Registrar
            </Button>
          </form>

          {lead.interacoes && lead.interacoes.length > 0 ? (
            <ul className="space-y-2">
              {lead.interacoes.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      {INTERACAO_LABELS[item.tipo]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {item.conteudo && (
                    <p className="mt-1.5 whitespace-pre-line text-zinc-300">{item.conteudo}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
              Nenhuma interação registrada ainda para este lead.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
