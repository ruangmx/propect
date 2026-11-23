import Link from 'next/link';
import {
  Search,
  MessageSquare,
  Globe,
  Sparkles,
  ArrowRight,
  Kanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          Prospect: Prospecção Ativa de Clientes
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          Localize pequenos negócios sem presença web em Brasília, conduza o funil comercial e envie abordagens personalizadas pelo WhatsApp.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/busca">
            <Button size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Nova Busca no Google Places
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/funil">
            <Button size="lg" variant="outline" className="gap-2">
              <Kanban className="h-4 w-4" />
              Abrir Funil de Leads
            </Button>
          </Link>
        </div>
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
            Busca paginada por nicho e 14 regiões de Brasília com validação de celular para WhatsApp.
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-purple-400 mb-2" />
            <CardTitle>2. Funil no WhatsApp</CardTitle>
            <CardDescription>
              Disparo semi-automático seguro com link wa.me direto para seu WhatsApp Business e registro automático da interação.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Agendamento automático de retorno em D+3 sem risco de bloqueio do número.
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <Globe className="h-8 w-8 text-emerald-400 mb-2" />
            <CardTitle>3. Demos por Nicho (Fase 2)</CardTitle>
            <CardDescription>
              Em seguida: páginas de demonstração interativas em rotas públicas para apresentar ao lead antes mesmo de fechar.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-zinc-500">
            Templates customizados para barbearias, hamburguerias e pequenos negócios locais.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
