import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { AppErrorCode, DomainError } from '@prospect/shared';
import { describe, expect, it, vi } from 'vitest';
import { GlobalExceptionFilter } from './global-exception.filter.js';

function run(exception: unknown) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  new GlobalExceptionFilter().catch(exception, host);
  return { status, body: json.mock.calls[0]?.[0] as { message: string; code: string } };
}

describe('GlobalExceptionFilter', () => {
  it('não vaza mensagem interna de erros inesperados', () => {
    const { status, body } = run(new Error('Unique constraint failed on leads_slug_key'));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Ocorreu um erro interno no servidor.');
  });

  it('mapeia DomainError para o status HTTP do código', () => {
    const { status, body } = run(new DomainError('Lead não encontrado.', AppErrorCode.NOT_FOUND));
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(body.message).toBe('Lead não encontrado.');
  });
});
