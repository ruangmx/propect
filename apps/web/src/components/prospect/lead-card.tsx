'use client';

import {
  Lead,
  LeadStatus,
  LEAD_ALLOWED_TRANSITIONS,
} from '@prospect/shared';
import {
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LeadCardProps {
  lead: Lead;
  isBusy: boolean;
  onSendWhatsapp: (leadId: string) => void;
  onChangeStatus: (leadId: string, status: LeadStatus) => void;
  onOpenDetails: (leadId: string) => void;
}

const PRESENCA_BADGE: Record<Lead['presencaWeb'], { label: string; variant: 'warning' | 'default' | 'success' }> = {
  SEM_SITE: { label: 'Sem site', variant: 'warning' },
  SO_REDE_SOCIAL: { label: 'Só rede social', variant: 'default' },
  TEM_SITE: { label: 'Tem site', variant: 'success' },
};

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

export function LeadCard({
  lead,
  isBusy,
  onSendWhatsapp,
  onChangeStatus,
  onOpenDetails,
}: LeadCardProps) {
  const presenca = PRESENCA_BADGE[lead.presencaWeb];
  const proximosStatus = LEAD_ALLOWED_TRANSITIONS[lead.status] ?? [];

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-3.5 shadow-sm transition hover:border-zinc-700 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-sm text-white" title={lead.nome}>
            {lead.nome}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3 shrink-0 text-zinc-500" />
            <span className="truncate">
              {lead.regiao?.nome ?? 'Brasília'} · {lead.nicho}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(lead.id)}
          aria-label={`Ver detalhes de ${lead.nome}`}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={presenca.variant}>{presenca.label}</Badge>
        {typeof lead.nota === 'number' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {lead.nota.toFixed(1)}
            {typeof lead.totalAvaliacoes === 'number' && (
              <span className="text-zinc-500">({lead.totalAvaliacoes})</span>
            )}
          </span>
        )}
      </div>

      {lead.telefone && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-300">
          <Phone className="h-3.5 w-3.5 text-zinc-500" />
          <span>{lead.telefone}</span>
          {lead.ehCelular && (
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
              Celular
            </span>
          )}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !lead.telefone}
          onClick={() => onSendWhatsapp(lead.id)}
          className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </Button>

        {lead.googleMapsUri && (
          <a
            href={lead.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${lead.nome} no Google Maps`}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-zinc-700 px-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Maps
          </a>
        )}
      </div>

      {proximosStatus.length > 0 && (
        <div className="pt-1 border-t border-zinc-800/80">
          <label className="sr-only" htmlFor={`status-${lead.id}`}>
            Mover status de {lead.nome}
          </label>
          <select
            id={`status-${lead.id}`}
            disabled={isBusy}
            value=""
            onChange={(e) => {
              const value = e.target.value as LeadStatus | '';
              if (value) onChangeStatus(lead.id, value);
            }}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Mover para...</option>
            {proximosStatus.map((st) => (
              <option key={st} value={st}>
                {STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>
      )}
    </article>
  );
}
