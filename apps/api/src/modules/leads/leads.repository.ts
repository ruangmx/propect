import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma, TipoInteracao } from '@prisma/client';
import { AppErrorCode, DomainError, LeadFilterQuery } from '@prospect/shared';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class LeadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPaginated(query: LeadFilterQuery) {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.nicho) {
      where.nicho = { contains: query.nicho, mode: 'insensitive' };
    }
    if (query.regiaoId) {
      where.regiaoId = query.regiaoId;
    }
    if (query.presencaWeb) {
      where.presencaWeb = query.presencaWeb;
    }
    if (query.search) {
      where.OR = [
        { nome: { contains: query.search, mode: 'insensitive' } },
        { endereco: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: { regiao: true, demo: true },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async findByIdWithDetails(id: string) {
    return this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        regiao: true,
        demo: true,
        interacoes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateStatusAndRecordInteraction(params: {
    id: string;
    statusAnterior: LeadStatus;
    novoStatus: LeadStatus;
    motivoPerda?: string;
    observacoes?: string;
    conteudoInteracao: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Escrita condicional: só altera se o status ainda for o que o service validou (evita TOCTOU).
      const { count } = await tx.lead.updateMany({
        where: { id: params.id, status: params.statusAnterior, deletedAt: null },
        data: {
          status: params.novoStatus,
          ...(params.motivoPerda !== undefined ? { motivoPerda: params.motivoPerda } : {}),
          ...(params.observacoes !== undefined ? { observacoes: params.observacoes } : {}),
        },
      });
      if (count === 0) {
        throw new DomainError(
          'O status do lead mudou durante a operação. Atualize a tela e tente novamente.',
          AppErrorCode.CONFLICT
        );
      }

      await tx.interacao.create({
        data: {
          leadId: params.id,
          tipo: 'MUDANCA_STATUS',
          conteudo: params.conteudoInteracao,
        },
      });

      return tx.lead.findUniqueOrThrow({
        where: { id: params.id },
        include: {
          regiao: true,
          demo: true,
          interacoes: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  }

  async recordWhatsappSent(params: {
    id: string;
    statusAnterior: LeadStatus;
    proximoContatoEm: Date;
    mensagem: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Escrita condicional: um lead descartado em paralelo nunca é sobrescrito para ENVIADO.
      const { count } = await tx.lead.updateMany({
        where: { id: params.id, status: params.statusAnterior, deletedAt: null },
        data: {
          status: 'ENVIADO',
          proximoContatoEm: params.proximoContatoEm,
        },
      });
      if (count === 0) {
        throw new DomainError(
          'O status do lead mudou durante a operação. Atualize a tela e tente novamente.',
          AppErrorCode.CONFLICT
        );
      }

      await tx.interacao.create({
        data: {
          leadId: params.id,
          tipo: 'MENSAGEM_ENVIADA',
          conteudo: params.mensagem,
        },
      });

      return tx.lead.findUniqueOrThrow({
        where: { id: params.id },
        include: {
          regiao: true,
          demo: true,
          interacoes: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  }

  async createInteraction(params: {
    leadId: string;
    tipo: TipoInteracao;
    conteudo?: string;
  }) {
    return this.prisma.interacao.create({
      data: {
        leadId: params.leadId,
        tipo: params.tipo,
        conteudo: params.conteudo ?? null,
      },
    });
  }
}
