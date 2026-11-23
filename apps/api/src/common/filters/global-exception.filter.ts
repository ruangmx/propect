import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError, AppErrorCode } from '@prospect/shared';
import { ZodError } from 'zod';

const DOMAIN_ERROR_STATUS: Record<string, HttpStatus> = {
  [AppErrorCode.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [AppErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [AppErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [AppErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [AppErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [AppErrorCode.UNPROCESSABLE_ENTITY]: HttpStatus.UNPROCESSABLE_ENTITY,
  [AppErrorCode.RATE_LIMITED]: HttpStatus.TOO_MANY_REQUESTS,
  [AppErrorCode.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = AppErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno no servidor.';
    let details: unknown = undefined;

    if (exception instanceof DomainError) {
      status = DOMAIN_ERROR_STATUS[exception.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      code = AppErrorCode.BAD_REQUEST;
      message = 'Erro de validação dos dados de entrada.';
      details = exception.format();
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = HttpStatus[status] || AppErrorCode.BAD_REQUEST;
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as { message?: string }).message || exception.message;
        details = res;
      }
    } else if (exception instanceof Error) {
      // Nunca expõe mensagens internas (Prisma, SQL, constraints) ao cliente: só registra no log.
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}

