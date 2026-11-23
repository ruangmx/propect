'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Busca,
  CreateBuscaResult,
  CreateBuscaSchema,
  NICHOS_SUGERIDOS,
  Regiao,
} from '@prospect/shared';
import { ApiClientError } from '@/lib/api-client';
import {
  executarBusca,
  listarBuscasRecentes,
  listarRegioes,
} from '@/lib/api/prospect.api';

export function useBuscasVm() {
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [buscasRecentes, setBuscasRecentes] = useState<Busca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nicho, setNicho] = useState<string>(NICHOS_SUGERIDOS[0]);
  const [selectedRegiaoIds, setSelectedRegiaoIds] = useState<string[]>([]);

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CreateBuscaResult | null>(null);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [regioesData, buscasData] = await Promise.all([
        listarRegioes(),
        listarBuscasRecentes(),
      ]);
      setRegioes(regioesData);
      setBuscasRecentes(buscasData);
      setSelectedRegiaoIds((prev) => {
        if (prev.length > 0) return prev;
        return regioesData.slice(0, 3).map((r) => r.id);
      });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Não foi possível carregar as regiões e buscas recentes.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const toggleRegiao = useCallback((id: string) => {
    setSelectedRegiaoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const selecionarTodasRegioes = useCallback(() => {
    setSelectedRegiaoIds(regioes.map((r) => r.id));
  }, [regioes]);

  const limparRegioes = useCallback(() => {
    setSelectedRegiaoIds([]);
  }, []);

  const dispararBusca = useCallback(async () => {
    setSearchError(null);

    const parsed = CreateBuscaSchema.safeParse({
      nicho,
      regiaoIds: selectedRegiaoIds,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? 'Dados inválidos para busca.';
      setSearchError(firstIssue);
      return;
    }

    setIsSearching(true);
    try {
      const result = await executarBusca(parsed.data);
      setLastResult(result);
      const buscasAtualizadas = await listarBuscasRecentes();
      setBuscasRecentes(buscasAtualizadas);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Erro inesperado ao executar a busca no Google Places.';
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }, [nicho, selectedRegiaoIds]);

  return {
    regioes,
    buscasRecentes,
    isLoading,
    error,
    carregarDados,
    nicho,
    setNicho,
    selectedRegiaoIds,
    toggleRegiao,
    selecionarTodasRegioes,
    limparRegioes,
    isSearching,
    searchError,
    lastResult,
    dispararBusca,
  };
}
