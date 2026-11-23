'use client';

import { useEffect, useState } from 'react';
import {
  DemoDados,
  DemoTemplate,
  Lead,
  UpdateDemoInput,
  canTransitionLeadStatus,
  obterPaletaPorTemplate,
} from '@prospect/shared';
import {
  ExternalLink,
  Eye,
  MessageCircle,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DemoPreviewModalProps {
  lead: Lead;
  isBusy: boolean;
  onClose: () => void;
  onSave: (demoId: string, leadId: string, input: UpdateDemoInput) => void;
  onRegenerate: (leadId: string, template: DemoTemplate) => void;
  onSendWhatsapp: (leadId: string) => void;
}

export function DemoPreviewModal({
  lead,
  isBusy,
  onClose,
  onSave,
  onRegenerate,
  onSendWhatsapp,
}: DemoPreviewModalProps) {
  const demo = lead.demo;

  const [template, setTemplate] = useState<DemoTemplate>(demo?.template ?? 'barbearia');
  const [titulo, setTitulo] = useState(demo?.dados.titulo ?? '');
  const [subtitulo, setSubtitulo] = useState(demo?.dados.subtitulo ?? '');
  const [descricao, setDescricao] = useState(demo?.dados.descricao ?? '');
  const [chamadaAcao, setChamadaAcao] = useState(demo?.dados.chamadaAcao ?? '');
  const [horario, setHorario] = useState(demo?.dados.horarioFuncionamento ?? '');
  const [logoUrl, setLogoUrl] = useState(demo?.logoUrl ?? '');
  const [corPrimaria, setCorPrimaria] = useState(demo?.dados.corPrimaria ?? '#111827');
  const [corDestaque, setCorDestaque] = useState(demo?.dados.corDestaque ?? '#d97706');

  useEffect(() => {
    if (!demo) return;
    setTemplate(demo.template);
    setTitulo(demo.dados.titulo);
    setSubtitulo(demo.dados.subtitulo);
    setDescricao(demo.dados.descricao);
    setChamadaAcao(demo.dados.chamadaAcao);
    setHorario(demo.dados.horarioFuncionamento);
    setLogoUrl(demo.logoUrl ?? '');
    setCorPrimaria(demo.dados.corPrimaria);
    setCorDestaque(demo.dados.corDestaque);
  }, [demo]);

  if (!demo) return null;

  const podeEnviarWhatsapp =
    Boolean(lead.telefone) && canTransitionLeadStatus(lead.status, 'ENVIADO');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dadosAtualizados: DemoDados = {
      ...demo.dados,
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim(),
      descricao: descricao.trim(),
      chamadaAcao: chamadaAcao.trim(),
      horarioFuncionamento: horario.trim(),
      corPrimaria,
      corDestaque,
    };

    onSave(demo.id, lead.id, {
      template,
      dados: dadosAtualizados,
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-preview-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 id="demo-preview-title" className="text-xl font-bold text-white">
              Revisar Demo: {lead.nome}
            </h2>
            <p className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
              <span>Rota pública: /demo/{lead.slug}</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Eye className="h-3.5 w-3.5" />
                {demo.visualizacoes} visualizações
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pré-visualização da demo"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lead.slug && (
            <a
              href={`/demo/${lead.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3.5 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir prévia ao vivo
            </a>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => onRegenerate(lead.id, template)}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Regerar textos
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isBusy || !podeEnviarWhatsapp}
            onClick={() => onSendWhatsapp(lead.id)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar no WhatsApp
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="demo-template" className="block text-xs font-medium text-zinc-400 mb-1">
                Template do nicho
              </label>
              <select
                id="demo-template"
                value={template}
                onChange={(e) => {
                  const next = e.target.value as DemoTemplate;
                  setTemplate(next);
                  const paleta = obterPaletaPorTemplate(next);
                  setCorPrimaria(paleta.corPrimaria);
                  setCorDestaque(paleta.corDestaque);
                }}
                className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
              >
                <option value="barbearia">Barbearia</option>
                <option value="hamburgueria">Hamburgueria</option>
              </select>
            </div>
            <div>
              <label htmlFor="demo-cor-primaria" className="block text-xs font-medium text-zinc-400 mb-1">
                Cor de fundo
              </label>
              <Input
                id="demo-cor-primaria"
                type="color"
                value={corPrimaria}
                onChange={(e) => setCorPrimaria(e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div>
              <label htmlFor="demo-cor-destaque" className="block text-xs font-medium text-zinc-400 mb-1">
                Cor de destaque
              </label>
              <Input
                id="demo-cor-destaque"
                type="color"
                value={corDestaque}
                onChange={(e) => setCorDestaque(e.target.value)}
                className="h-10 p-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="demo-logo" className="block text-xs font-medium text-zinc-400 mb-1">
              URL da logo (opcional, HTTPS, preencher quando o lead enviar)
            </label>
            <Input
              id="demo-logo"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="demo-titulo" className="block text-xs font-medium text-zinc-400 mb-1">
              Título principal
            </label>
            <Input
              id="demo-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="demo-subtitulo" className="block text-xs font-medium text-zinc-400 mb-1">
              Subtítulo
            </label>
            <Input
              id="demo-subtitulo"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="demo-descricao" className="block text-xs font-medium text-zinc-400 mb-1">
              Descrição do negócio
            </label>
            <textarea
              id="demo-descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="demo-cta" className="block text-xs font-medium text-zinc-400 mb-1">
                Texto do botão (CTA)
              </label>
              <Input
                id="demo-cta"
                value={chamadaAcao}
                onChange={(e) => setChamadaAcao(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="demo-horario" className="block text-xs font-medium text-zinc-400 mb-1">
                Horário de funcionamento
              </label>
              <Input
                id="demo-horario"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy} className="gap-1.5">
              <Save className="h-4 w-4" />
              Salvar revisão
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
