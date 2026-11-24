import { describe, expect, it, vi } from 'vitest';
import { EnvService } from '../../common/env/env.service.js';
import { AnthropicCopyClient } from './anthropic-copy.client.js';

describe('AnthropicCopyClient', () => {
  it('usa fallback determinístico de barbearia quando ANTHROPIC_API_KEY não está definida', async () => {
    const envService = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as EnvService;

    const client = new AnthropicCopyClient(envService);
    const result = await client.gerarTextosDemo({
      nome: 'Barbearia Dom Pedro',
      nicho: 'barbearia',
      bairro: 'Águas Claras',
      template: 'barbearia',
    });

    expect(result.geradoPorIa).toBe(false);
    expect(result.dados.titulo).toContain('Barbearia Dom Pedro');
    expect(result.dados.servicos).toHaveLength(4);
    expect(result.dados.corDestaque).toBe('#d97706');
  });

  it('usa fallback de hamburgueria quando a API da Anthropic retorna erro HTTP', async () => {
    const envService = {
      get: vi.fn().mockReturnValue('sk-ant-fake'),
    } as unknown as EnvService;

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'Overloaded' } }),
    } as Response);

    const client = new AnthropicCopyClient(envService);
    const result = await client.gerarTextosDemo({
      nome: 'Brasa Burger',
      nicho: 'hamburgueria',
      bairro: 'Guará',
      template: 'hamburgueria',
    });

    expect(result.geradoPorIa).toBe(false);
    expect(result.dados.titulo).toContain('Brasa Burger');
    expect(result.dados.corDestaque).toBe('#ea580c');
    fetchSpy.mockRestore();
  });
});
