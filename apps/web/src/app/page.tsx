import { Search, MessageSquare, Globe, Sparkles, Building2, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5" />
          Prospecção Inteligente B2B
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Prospect — Prospecção Ativa de Clientes
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Localize pequenos negócios sem presença web, gere demonstrações personalizadas em segundos e conduza o funil pelo WhatsApp.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <Search className="h-8 w-8 text-blue-400 mb-2" />
            <CardTitle>1. Coleta Inteligente</CardTitle>
            <CardDescription>
              Integração com Google Places API (New Text Search). Filtro automático de negócios sem site ou apenas com redes sociais.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Busca paginada por nicho e regiões de Brasília com validação de celular para WhatsApp.
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <Globe className="h-8 w-8 text-emerald-400 mb-2" />
            <CardTitle>2. Demos por Nicho</CardTitle>
            <CardDescription>
              Criação rápida de páginas de demonstração interativas em rotas públicas para apresentar ao lead.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Templates customizados para barbearias, hamburguerias e pequenos negócios locais.
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-purple-400 mb-2" />
            <CardTitle>3. Funil no WhatsApp</CardTitle>
            <CardDescription>
              Disparo semi-automático seguro com link wa.me direto para seu WhatsApp Business.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Lembretes de follow-up (D+3 e D+7) sem risco de bloqueio de número.
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 justify-center sm:justify-start">
            <Building2 className="h-5 w-5 text-blue-400" />
            Fase 0 Concluída: Template Pronto
          </h2>
          <p className="text-sm text-zinc-400">
            O ambiente está configurado e pronto para a implementação da Fase 1 (Coleta e Funil de Vendas).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <TrendingUp className="h-4 w-4" />
          Fase 1 Pronta para Início
        </div>
      </div>
    </div>
  );
}

