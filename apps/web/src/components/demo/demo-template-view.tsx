'use client';

import Image from 'next/image';
import {
  PublicDemoResponse,
  extrairDigitosTelefone,
  sanitizeHttpsUrl,
} from '@prospect/shared';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  MessageCircle,
  Scissors,
  Star,
} from 'lucide-react';

interface DemoTemplateViewProps {
  demo: PublicDemoResponse;
}

export function DemoTemplateView({ demo }: DemoTemplateViewProps) {
  const { dados, negocio, template } = demo;
  const logoSegura = sanitizeHttpsUrl(demo.logoUrl);
  const mapsSeguro = sanitizeHttpsUrl(negocio.googleMapsUri);
  const instagramSeguro = sanitizeHttpsUrl(negocio.instagram);

  const digitos = extrairDigitosTelefone(negocio.telefone);
  const whatsappContato =
    digitos.length >= 10
      ? `https://wa.me/55${digitos}?text=${encodeURIComponent(
          `Olá! Vi o site da ${negocio.nome} e gostaria de saber mais.`
        )}`
      : null;

  const isHamburgueria = template === 'hamburgueria';
  const accentStyle = { backgroundColor: dados.corDestaque };
  const borderAccentStyle = { borderColor: dados.corDestaque };

  return (
    <div
      className="min-h-screen text-zinc-100"
      style={{ backgroundColor: dados.corPrimaria }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="container mx-auto max-w-5xl px-4 py-16 sm:py-24 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {logoSegura ? (
                <Image
                  src={logoSegura}
                  alt={`Logo ${negocio.nome}`}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-12 w-12 rounded-xl object-cover border border-white/15 bg-white/5"
                />
              ) : (
                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                  style={accentStyle}
                >
                  {isHamburgueria ? (
                    <Flame className="h-6 w-6" />
                  ) : (
                    <Scissors className="h-6 w-6" />
                  )}
                </span>
              )}
              <div>
                <p className="text-lg font-bold tracking-tight text-white">
                  {negocio.nome}
                </p>
                <p className="text-xs text-zinc-300">
                  {negocio.bairro ? `${negocio.bairro}, Brasília` : 'Brasília, DF'}
                </p>
              </div>
            </div>

            {typeof negocio.nota === 'number' && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-100">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{negocio.nota.toFixed(1)} no Google</span>
                {typeof negocio.totalAvaliacoes === 'number' && (
                  <span className="text-zinc-400">({negocio.totalAvaliacoes} avaliações)</span>
                )}
              </div>
            )}
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {dados.titulo}
            </h1>
            <p className="text-base sm:text-xl text-zinc-300 leading-relaxed">
              {dados.subtitulo}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {whatsappContato && (
              <a
                href={whatsappContato}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                style={accentStyle}
              >
                <MessageCircle className="h-4 w-4" />
                {dados.chamadaAcao}
              </a>
            )}
            {mapsSeguro && (
              <a
                href={mapsSeguro}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                <MapPin className="h-4 w-4" />
                Como chegar
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Sobre + Diferenciais */}
      <section className="container mx-auto max-w-5xl px-4 py-14 grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Sobre nós
          </p>
          <h2 className="text-2xl font-bold text-white">
            {isHamburgueria ? 'Feito na hora com ingredientes selecionados' : 'Tradição, estilo e pontualidade'}
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
            {dados.descricao}
          </p>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/25 p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Por que escolher a {negocio.nome}
          </h3>
          <ul className="space-y-3">
            {dados.diferenciais.map((dif) => (
              <li key={dif} className="flex items-start gap-2.5 text-sm text-zinc-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{dif}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Serviços / Cardápio */}
      <section className="container mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isHamburgueria ? 'Cardápio em destaque' : 'Nossos serviços'}
          </p>
          <h2 className="text-2xl font-bold text-white">
            {isHamburgueria ? 'Destaques da casa' : 'Cortes, barba e cuidados'}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {dados.servicos.map((servico) => (
            <div
              key={servico.nome}
              className="rounded-2xl border border-white/10 bg-black/25 p-5 flex flex-col justify-between gap-3"
              style={{ borderLeftWidth: '4px', ...borderAccentStyle }}
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base text-white">{servico.nome}</h3>
                  {servico.preco && (
                    <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white">
                      {servico.preco}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-300">{servico.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Horários e Localização */}
      <section className="container mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white">Horário e localização</h2>
            <p className="flex items-center gap-2 text-sm text-zinc-300">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{dados.horarioFuncionamento}</span>
            </p>
            {negocio.endereco && (
              <p className="flex items-center gap-2 text-sm text-zinc-300">
                <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
                <span>{negocio.endereco}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {whatsappContato && (
              <a
                href={whatsappContato}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={accentStyle}
              >
                <MessageCircle className="h-4 w-4" />
                {dados.chamadaAcao}
              </a>
            )}
            {instagramSeguro && (
              <a
                href={instagramSeguro}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10 transition"
              >
                <ExternalLink className="h-4 w-4" />
                Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-400">
        Prévia personalizada criada por Ruan Máximo (4R Tech) para {negocio.nome}
      </footer>
    </div>
  );
}
