'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DemoTemplate,
  Lead,
  LeadStatus,
  PresencaWeb,
  Regiao,
  TipoInteracao,
  UpdateDemoInput,
} from '@prospect/shared';
import { ApiClientError } from '@/lib/api-client';
import {
  adicionarInteracaoLead,
  atualizarDemo,
  atualizarStatusLead,
  buscarLeadPorId,
  enviarWhatsappLead,
  gerarDemoLead,
  listarLeads,
  listarRegioes,
} from '@/lib/api/prospect.api';

export const KANBAN_COLUMNS: ReadonlyArray<{
  status: LeadStatus;
  label: string;
  accentClass: string;
}> = [
  { status: 'NOVO', label: 'Novos (WhatsApp)', accentClass: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  { status: 'LIGAR', label: 'Ligar (Fixo)', accentClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { status: 'DEMO_PRONTA', label: 'Demo pronta', accentClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  { status: 'ENVIADO', label: 'Enviado', accentClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
  { status: 'RESPONDEU', label: 'Respondeu', accentClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  { status: 'REUNIAO', label: 'Reunião', accentClass: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
  { status: 'FECHOU', label: 'Fechou', accentClass: 'border-green-500/40 bg-green-500/10 text-green-300' },
  { status: 'PERDIDO', label: 'Perdido', accentClass: 'border-red-500/40 bg-red-500/10 text-red-300' },
  { status: 'SEM_RESPOSTA', label: 'Sem resposta', accentClass: 'border-zinc-600/50 bg-zinc-800 text-zinc-300' },
  { status: 'DESCARTADO', label: 'Descartado', accentClass: 'border-zinc-700 bg-zinc-900 text-zinc-400' },
];

export function useLeadsVm() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [nichoFiltro, setNichoFiltro] = useState('');
  const [regiaoIdFiltro, setRegiaoIdFiltro] = useState('');
  const [presencaWebFiltro, setPresencaWebFiltro] = useState<PresencaWeb | ''>('');
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const carregarLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsResponse, regioesResponse] = await Promise.all([
        listarLeads({
          limit: 100,
          search: search.trim() || undefined,
          nicho: nichoFiltro.trim() || undefined,
          regiaoId: regiaoIdFiltro || undefined,
          presencaWeb: presencaWebFiltro || undefined,
        }),
        listarRegioes(),
      ]);
      setLeads(leadsResponse.items);
      setRegioes(regioesResponse);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar os leads do funil.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, nichoFiltro, regiaoIdFiltro, presencaWebFiltro]);

  useEffect(() => {
    void carregarLeads();
  }, [carregarLeads]);

  const colunasVisiveis = useMemo(() => {
    if (mostrarArquivados) return KANBAN_COLUMNS;
    return KANBAN_COLUMNS.filter(
      (col) => col.status !== 'SEM_RESPOSTA' && col.status !== 'DESCARTADO'
    );
  }, [mostrarArquivados]);

  const leadsPorStatus = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.status, []);
    }
    for (const lead of leads) {
      const list = map.get(lead.status);
      if (list) {
        list.push(lead);
      }
    }
    return map;
  }, [leads]);

  const enviarWhatsapp = useCallback(async (leadId: string) => {
    setActionError(null);
    setBusyLeadId(leadId);
    try {
      const result = await enviarWhatsappLead(leadId);
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? result.lead : item))
      );
      setSelectedLead((prev) => (prev?.id === leadId ? result.lead : prev));
      setPreviewLead((prev) => (prev?.id === leadId ? result.lead : prev));
      window.open(result.whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível gerar o link do WhatsApp.';
      setActionError(message);
    } finally {
      setBusyLeadId(null);
    }
  }, []);

  const mudarStatus = useCallback(
    async (leadId: string, status: LeadStatus, motivoPerda?: string) => {
      setActionError(null);
      setBusyLeadId(leadId);
      try {
        const updated = await atualizarStatusLead(leadId, {
          status,
          motivoPerda,
        });
        setLeads((prev) =>
          prev.map((item) => (item.id === leadId ? updated : item))
        );
        setSelectedLead((prev) => (prev?.id === leadId ? updated : prev));
        setPreviewLead((prev) => (prev?.id === leadId ? updated : prev));
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível atualizar o status do lead.';
        setActionError(message);
      } finally {
        setBusyLeadId(null);
      }
    },
    []
  );

  const abrirDetalhes = useCallback(async (leadId: string) => {
    setIsLoadingDetail(true);
    setActionError(null);
    try {
      const detalhe = await buscarLeadPorId(leadId);
      setSelectedLead(detalhe);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar os detalhes do lead.';
      setActionError(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const fecharDetalhes = useCallback(() => {
    setSelectedLead(null);
  }, []);

  const registrarInteracao = useCallback(
    async (leadId: string, tipo: TipoInteracao, conteudo: string) => {
      setActionError(null);
      setBusyLeadId(leadId);
      try {
        await adicionarInteracaoLead(leadId, { tipo, conteudo });
        const detalhe = await buscarLeadPorId(leadId);
        setSelectedLead(detalhe);
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível registrar a interação.';
        setActionError(message);
      } finally {
        setBusyLeadId(null);
      }
    },
    []
  );

  const gerarDemo = useCallback(async (leadId: string, template?: DemoTemplate) => {
    setActionError(null);
    setBusyLeadId(leadId);
    try {
      const result = await gerarDemoLead(leadId, template ? { template } : {});
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? result.lead : item))
      );
      setSelectedLead((prev) => (prev?.id === leadId ? result.lead : prev));
      setPreviewLead(result.lead);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível gerar a demo para este lead.';
      setActionError(message);
    } finally {
      setBusyLeadId(null);
    }
  }, []);

  const abrirPreviewDemo = useCallback(async (leadId: string) => {
    const local = leads.find((l) => l.id === leadId);
    if (local?.demo) {
      setPreviewLead(local);
      return;
    }
    setIsLoadingDetail(true);
    try {
      const detalhe = await buscarLeadPorId(leadId);
      setPreviewLead(detalhe);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar a pré-visualização da demo.';
      setActionError(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [leads]);

  const fecharPreviewDemo = useCallback(() => {
    setPreviewLead(null);
  }, []);

  const salvarEdicaoDemo = useCallback(
    async (demoId: string, leadId: string, input: UpdateDemoInput) => {
      setActionError(null);
      setBusyLeadId(leadId);
      try {
        const updatedDemo = await atualizarDemo(demoId, input);
        setLeads((prev) =>
          prev.map((item) =>
            item.id === leadId ? { ...item, demo: updatedDemo } : item
          )
        );
        setPreviewLead((prev) =>
          prev?.id === leadId ? { ...prev, demo: updatedDemo } : prev
        );
        setSelectedLead((prev) =>
          prev?.id === leadId ? { ...prev, demo: updatedDemo } : prev
        );
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível salvar as alterações da demo.';
        setActionError(message);
      } finally {
        setBusyLeadId(null);
      }
    },
    []
  );

  return {
    leads,
    regioes,
    isLoading,
    error,
    actionError,
    setActionError,
    busyLeadId,
    carregarLeads,
    search,
    setSearch,
    nichoFiltro,
    setNichoFiltro,
    regiaoIdFiltro,
    setRegiaoIdFiltro,
    presencaWebFiltro,
    setPresencaWebFiltro,
    mostrarArquivados,
    setMostrarArquivados,
    colunasVisiveis,
    leadsPorStatus,
    enviarWhatsapp,
    mudarStatus,
    selectedLead,
    isLoadingDetail,
    abrirDetalhes,
    fecharDetalhes,
    registrarInteracao,
    previewLead,
    gerarDemo,
    abrirPreviewDemo,
    fecharPreviewDemo,
    salvarEdicaoDemo,
  };
}
