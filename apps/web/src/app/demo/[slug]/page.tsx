'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DemoTemplateView } from '@/components/demo/demo-template-view';
import { usePublicDemoVm } from '@/hooks/use-public-demo-vm';

export default function PublicDemoPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const vm = usePublicDemoVm(slug);

  if (vm.isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (vm.notFound || (!vm.error && !vm.demo)) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="py-12 text-center space-y-4">
            <h1 className="text-xl font-bold text-white">Demonstração não encontrada</h1>
            <p className="text-sm text-zinc-400">
              Este link pode ter expirado ou não corresponde a nenhuma prévia ativa.
            </p>
            <Link href="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vm.error || !vm.demo) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-white">Erro ao carregar prévia</h1>
              <p className="text-sm text-zinc-400">{vm.error}</p>
            </div>
            <Button type="button" onClick={() => void vm.carregar()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DemoTemplateView demo={vm.demo} />;
}
