'use client';

import Link from 'next/link';
import { NICHOS_SUGERIDOS } from '@prospect/shared';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBuscasVm } from '@/hooks/use-buscas-vm';

export default function BuscaPage() {
  const vm = useBuscasVm();

  if (vm.isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (vm.error) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-white">Erro ao carregar busca</h1>
              <p className="text-sm text-zinc-400">{vm.error}</p>
            </div>
            <Button type="button" onClick={() => void vm.carregarDados()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Nova Busca de Leads</h1>
          <p className="text-sm text-zinc-400">
            Escolha o nicho e as regiões de Brasília para buscar negócios sem site próprio no Google Places.
          </p>
        </div>
        <Link href="/funil">
          <Button variant="outline" className="gap-2">
            Ir para o Funil
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-lg">1. Escolha o nicho</CardTitle>
          <CardDescription>
            Selecione um nicho sugerido ou digite qualquer segmento comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {NICHOS_SUGERIDOS.map((item) => {
              const ativo = vm.nicho.toLowerCase() === item.toLowerCase();
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => vm.setNicho(item)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                    ativo
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="max-w-md">
            <label htmlFor="nicho-input" className="sr-only">
              Nicho para busca
            </label>
            <Input
              id="nicho-input"
              placeholder="Ou digite um nicho personalizado (ex.: estúdio de tatuagem)"
              value={vm.nicho}
              onChange={(e) => vm.setNicho(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg">
              2. Selecione as regiões ({vm.selectedRegiaoIds.length} selecionadas)
            </CardTitle>
            <CardDescription>
              Cada região consulta até 3 páginas (máximo 60 negócios) no Text Search.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={vm.selecionarTodasRegioes}>
              Selecionar todas
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={vm.limparRegioes}>
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {vm.regioes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
              Nenhuma região ativa cadastrada no banco. Rode o seed de regiões para começar.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {vm.regioes.map((regiao) => {
                const selecionada = vm.selectedRegiaoIds.includes(regiao.id);
                return (
                  <button
                    key={regiao.id}
                    type="button"
                    onClick={() => vm.toggleRegiao(regiao.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition cursor-pointer ${
                      selecionada
                        ? 'border-blue-500 bg-blue-500/15 text-white'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        selecionada ? 'text-blue-400' : 'text-zinc-600'
                      }`}
                    />
                    <span className="truncate font-medium">{regiao.nome}</span>
                  </button>
                );
              })}
            </div>
          )}

          {vm.searchError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{vm.searchError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="lg"
              disabled={vm.isSearching || vm.selectedRegiaoIds.length === 0}
              onClick={() => void vm.dispararBusca()}
              className="gap-2"
            >
              {vm.isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando no Google Places...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar Leads Agora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {vm.lastResult && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              Resultado da busca: {vm.lastResult.nicho}
            </CardTitle>
            <CardDescription>
              {vm.lastResult.totalRegioes} regiões consultadas usando {vm.lastResult.chamadasApi}{' '}
              chamadas da API do Google Places.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <p className="text-xs text-zinc-400">Encontrados</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {vm.lastResult.totalEncontrado}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <p className="text-xs text-zinc-400">Novos salvos</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {vm.lastResult.totalNovos}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <p className="text-xs text-zinc-400">Já tinham site</p>
                <p className="mt-1 text-2xl font-bold text-zinc-300">
                  {vm.lastResult.totalComSiteProprio}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <p className="text-xs text-zinc-400">Duplicados ignorados</p>
                <p className="mt-1 text-2xl font-bold text-zinc-400">
                  {vm.lastResult.totalDuplicados}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/funil">
                <Button className="gap-2">
                  Ver leads no Funil
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Buscas recentes</h2>
        {vm.buscasRecentes.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-900/30">
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              Nenhuma busca realizada ainda. Escolha um nicho e clique em Buscar Leads Agora.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {vm.buscasRecentes.map((busca) => (
              <Card key={busca.id} className="border-zinc-800 bg-zinc-900/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-white">
                      {busca.nicho} · {busca.regiao?.nome ?? 'Região'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(busca.createdAt).toLocaleString('pt-BR')} · {busca.chamadasApi}{' '}
                      chamadas API
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">+{busca.totalNovos} novos</Badge>
                    <Badge variant="default">{busca.totalEncontrado} total</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
