import { describe, expect, it } from 'vitest';
import {
  assertLeadStatusTransition,
  buildDemoUrl,
  calcularProximoContato,
  canTransitionLeadStatus,
  classificar,
  ehCelular,
  extrairDigitosTelefone,
  extrairInstagram,
  gerarLinkWhatsapp,
  gerarMensagemWhatsapp,
  gerarSlugDemo,
  obterPaletaPorTemplate,
  resolverTemplateDemo,
  sanitizeHttpsUrl,
} from './prospect.domain.js';

describe('Domínio Prospect — Classificação e Qualificação de Leads', () => {
  describe('classificar()', () => {
    it('descarta negócios fechados temporariamente ou permanentemente', () => {
      expect(
        classificar({
          businessStatus: 'CLOSED_PERMANENTLY',
          websiteUri: undefined,
        })
      ).toBe('DESCARTAR');

      expect(
        classificar({
          businessStatus: 'CLOSED_TEMPORARILY',
          websiteUri: 'https://instagram.com/barbearia',
        })
      ).toBe('DESCARTAR');
    });

    it('classifica como SEM_SITE quando está operando e não possui websiteUri', () => {
      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: undefined,
        })
      ).toBe('SEM_SITE');

      expect(
        classificar({
          businessStatus: undefined,
          websiteUri: null,
        })
      ).toBe('SEM_SITE');
    });

    it('classifica como SO_REDE_SOCIAL para links de Instagram, Facebook, Linktree, WhatsApp e iFood', () => {
      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://www.instagram.com/barbeariabrasilia/',
        })
      ).toBe('SO_REDE_SOCIAL');

      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://facebook.com/hamburgueriaartesanal',
        })
      ).toBe('SO_REDE_SOCIAL');

      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://linktr.ee/petshopaguasclaras',
        })
      ).toBe('SO_REDE_SOCIAL');

      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://wa.me/5561999998888',
        })
      ).toBe('SO_REDE_SOCIAL');

      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://www.ifood.com.br/delivery/brasilia-df/burguer',
        })
      ).toBe('SO_REDE_SOCIAL');
    });

    it('classifica como TEM_SITE quando possui domínio próprio', () => {
      expect(
        classificar({
          businessStatus: 'OPERATIONAL',
          websiteUri: 'https://barbeariadosul.com.br',
        })
      ).toBe('TEM_SITE');
    });
  });

  describe('ehCelular()', () => {
    it('identifica celulares brasileiros válidos no formato nacional com DDD', () => {
      expect(ehCelular('(61) 99876-5432')).toBe(true);
      expect(ehCelular('(61)98123-4567')).toBe(true);
      expect(ehCelular('(11) 91234-5678')).toBe(true);
    });

    it('retorna false para telefones fixos, 0800 ou ausentes', () => {
      expect(ehCelular('(61) 3322-4455')).toBe(false);
      expect(ehCelular('(61) 3030-1020')).toBe(false);
      expect(ehCelular('0800 123 4567')).toBe(false);
      expect(ehCelular(undefined)).toBe(false);
      expect(ehCelular(null)).toBe(false);
      expect(ehCelular('')).toBe(false);
    });
  });

  describe('extrairDigitosTelefone() e gerarLinkWhatsapp()', () => {
    it('extrai apenas dígitos e monta link wa.me sem duplicar o DDI 55', () => {
      expect(extrairDigitosTelefone('(61) 99876-5432')).toBe('61998765432');
      expect(extrairDigitosTelefone('+55 (61) 99876-5432')).toBe('61998765432');

      const msg = gerarMensagemWhatsapp({
        nome: 'Barbearia Dom Pedro',
        bairro: 'Águas Claras',
        linkDemo: 'https://demos.4rtech.com.br/demo/barbearia-dom-pedro',
      });
      expect(msg).toContain('Barbearia Dom Pedro');
      expect(msg).toContain('https://demos.4rtech.com.br/demo/barbearia-dom-pedro');

      const url = gerarLinkWhatsapp('(61) 99876-5432', msg);
      expect(url.startsWith('https://wa.me/5561998765432?text=')).toBe(true);
    });
  });

  describe('extrairInstagram(), sanitizeHttpsUrl() e calcularProximoContato()', () => {
    it('extrai URL do Instagram apenas quando for HTTPS do domínio instagram.com', () => {
      expect(extrairInstagram('https://instagram.com/barbearia')).toBe(
        'https://instagram.com/barbearia'
      );
      expect(extrairInstagram('https://www.instagram.com/barbearia')).toBe(
        'https://www.instagram.com/barbearia'
      );
      expect(extrairInstagram('javascript:alert(1)//instagram.com')).toBeNull();
      expect(extrairInstagram('http://instagram.com/barbearia')).toBeNull();
      expect(extrairInstagram('https://meusite.com.br')).toBeNull();
      expect(extrairInstagram(null)).toBeNull();
    });

    it('bloqueia esquemas não HTTPS em sanitizeHttpsUrl', () => {
      expect(sanitizeHttpsUrl('https://maps.google.com/?cid=123')).toBe(
        'https://maps.google.com/?cid=123'
      );
      expect(sanitizeHttpsUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeHttpsUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('calcula D+3 em UTC corretamente', () => {
      const base = new Date('2026-11-16T12:00:00.000Z');
      const d3 = calcularProximoContato(base, 3);
      expect(d3.toISOString()).toBe('2026-11-19T12:00:00.000Z');
    });
  });

  describe('Máquina de estados do Funil (LeadStatus)', () => {
    it('permite transições válidas do funil', () => {
      expect(canTransitionLeadStatus('NOVO', 'DEMO_PRONTA')).toBe(true);
      expect(canTransitionLeadStatus('NOVO', 'ENVIADO')).toBe(true);
      expect(canTransitionLeadStatus('ENVIADO', 'RESPONDEU')).toBe(true);
      expect(canTransitionLeadStatus('RESPONDEU', 'REUNIAO')).toBe(true);
      expect(canTransitionLeadStatus('REUNIAO', 'FECHOU')).toBe(true);
    });

    it('bloqueia transição direta inválida como DESCARTADO -> FECHOU', () => {
      expect(canTransitionLeadStatus('DESCARTADO', 'FECHOU')).toBe(false);
      expect(() => assertLeadStatusTransition('DESCARTADO', 'FECHOU')).toThrow();
    });
  });

  describe('Helpers de Demo (Fase 2)', () => {
    it('gera slug normalizado sem acentos nem caracteres especiais', () => {
      expect(gerarSlugDemo('Barbearia São José & Cia')).toBe('barbearia-sao-jose-cia');
      expect(gerarSlugDemo('Águas Burger!', 'ab12')).toBe('aguas-burger-ab12');
    });

    it('resolve template por nicho e retorna paleta de cores', () => {
      expect(resolverTemplateDemo('hamburgueria artesanal')).toBe('hamburgueria');
      expect(resolverTemplateDemo('barbearia')).toBe('barbearia');
      expect(obterPaletaPorTemplate('hamburgueria').corDestaque).toBe('#ea580c');
      expect(obterPaletaPorTemplate('barbearia').corDestaque).toBe('#d97706');
    });

    it('monta URL pública da demo sem barras duplicadas', () => {
      expect(buildDemoUrl('https://demos.4rtech.com.br/', '/barbearia-dom-pedro')).toBe(
        'https://demos.4rtech.com.br/demo/barbearia-dom-pedro'
      );
    });
  });
});
