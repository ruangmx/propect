'use client';

import Link from 'next/link';
import { PresencaWeb } from '@prospect/shared';
import {
  AlertCircle,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadCard } from '@/components/prospect/lead-card';
import { LeadDetailModal } from '@/components/prospect/lead-detail-modal';
import { DemoPreviewModal } from '@/components/prospect/demo-preview-modal';
import { useLeadsVm } from '@/hooks/use-leads-vm';

export default function FunilPage() {
  const vm = useLeadsVm();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Funil de Prospecção</h1>
          <p className="text-sm text-zinc-400">
            Acompanhe os leads sem site próprio, dispare o primeiro contato no WhatsApp e mova o funil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => vm.setMostrarArquivados(!vm.mostrarArquivados)}
          >
            {vm.mostrarArquivados ? 'Ocultar arquivados' : 'Mostrar sem resposta e descartados'}
          </Button>
          <Link href="/busca">
            <Button size="sm" className="gap-1.5">
              <Search className="h-4 w-4" />
              Nova Busca
            </Button>
          </Link>
        </div>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div>
          <label htmlFor="filtro-busca" className="sr-only">
            Buscar por nome ou endereço
          </label>
          <Input
            id="filtro-busca"
            placeholder="Buscar nome ou endereço..."
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filtro-nicho" className="sr-only">
            Filtrar por nicho
          </label>
          <Input
            id="filtro-nicho"
            placeholder="Filtrar nicho (ex.: barbearia)"
            value={vm.nichoFiltro}
            onChange={(e) => vm.setNichoFiltro(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filtro-regiao" className="sr-only">
            Filtrar por região
          </label>
          <select
            id="filtro-regiao"
            value={vm.regiaoIdFiltro}
            onChange={(e) => vm.setRegiaoIdFiltro(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas as regiões</option>
            {vm.regioes.map((regiao) => (
              <option key={regiao.id} value={regiao.id}>
                {regiao.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filtro-presenca" className="sr-only">
            Filtrar por presença web
          </label>
          <select
            id="filtro-presenca"
            value={vm.presencaWebFiltro}
            onChange={(e) => vm.setPresencaWebFiltro(e.target.value as PresencaWeb | '')}
            className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Toda presença web</option>
            <option value="SEM_SITE">Sem site</option>
            <option value="SO_REDE_SOCIAL">Só rede social</option>
          </select>
        </div>
      </section>

      {vm.actionError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {vm.actionError}
          </span>
          <button
            type="button"
            aria-label="Fechar alerta de erro"
            onClick={() => vm.setActionError(null)}
            className="rounded p-1 hover:bg-red-500/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {vm.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : vm.error ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Erro ao carregar o funil</h2>
              <p className="text-sm text-zinc-400">{vm.error}</p>
            </div>
            <Button type="button" onClick={() => void vm.carregarLeads()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : vm.leads.length === 0 ? (
        <Card className="border-dashed border-zinc-800 bg-zinc-900/30">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Sparkles className="h-10 w-10 text-blue-400" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Nenhum lead encontrado</h2>
              <p className="text-sm text-zinc-400">
                Ajuste os filtros ou execute uma nova busca no Google Places para preencher seu funil.
              </p>
            </div>
            <Link href="/busca">
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Fazer Nova Busca
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {vm.colunasVisiveis.map((col) => {
            const items = vm.leadsPorStatus.get(col.status) ?? [];
            return (
              <section
                key={col.status}
                className="flex w-72 shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 p-3"
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${col.accentClass}`}
                  >
                    {col.label}
                  </span>
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-400">
                    {items.length}
                  </span>
                </header>

                <div className="flex flex-col gap-3">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-800/80 py-6 text-center text-xs text-zinc-600">
                      Vazio
                    </p>
                  ) : (
                    items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        isBusy={vm.busyLeadId === lead.id}
                        onSendWhatsapp={(id) => void vm.enviarWhatsapp(id)}
                        onChangeStatus={(id, status) => void vm.mudarStatus(id, status)}
                        onOpenDetails={(id) => void vm.abrirDetalhes(id)}
                        onGenerateDemo={(id) => void vm.gerarDemo(id)}
                        onPreviewDemo={(id) => void vm.abrirPreviewDemo(id)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {vm.selectedLead && (
        <LeadDetailModal
          lead={vm.selectedLead}
          isBusy={vm.busyLeadId === vm.selectedLead.id || vm.isLoadingDetail}
          onClose={vm.fecharDetalhes}
          onSendWhatsapp={(id) => void vm.enviarWhatsapp(id)}
          onChangeStatus={(id, status, motivo) => void vm.mudarStatus(id, status, motivo)}
          onAddInteraction={(id, tipo, conteudo) =>
            void vm.registrarInteracao(id, tipo, conteudo)
          }
        />
      )}

      {vm.previewLead && (
        <DemoPreviewModal
          lead={vm.previewLead}
          isBusy={vm.busyLeadId === vm.previewLead.id || vm.isLoadingDetail}
          onClose={vm.fecharPreviewDemo}
          onSave={(demoId, leadId, input) => void vm.salvarEdicaoDemo(demoId, leadId, input)}
          onRegenerate={(leadId, template) => void vm.gerarDemo(leadId, template)}
          onSendWhatsapp={(id) => void vm.enviarWhatsapp(id)}
        />
      )}
    </div>
  );
}
