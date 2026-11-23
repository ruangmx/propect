import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma, TipoInteracao } from '@prisma/client';
import { LeadFilterQuery } from '@prospect/shared';
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
        include: { regiao: true },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async findByIdWithDetails(id: string) {
    return this.prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        regiao: true,
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
      const updated = await tx.lead.update({
        where: { id: params.id },
        data: {
          status: params.novoStatus,
          ...(params.motivoPerda !== undefined ? { motivoPerda: params.motivoPerda } : {}),
          ...(params.observacoes !== undefined ? { observacoes: params.observacoes } : {}),
        },
        include: {
          regiao: true,
          interacoes: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      await tx.interacao.create({
        data: {
          leadId: params.id,
          tipo: 'MUDANCA_STATUS',
          conteudo: params.conteudoInteracao,
        },
      });

      return updated;
    });
  }

  async recordWhatsappSent(params: {
    id: string;
    proximoContatoEm: Date;
    mensagem: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.interacao.create({
        data: {
          leadId: params.id,
          tipo: 'MENSAGEM_ENVIADA',
          conteudo: params.mensagem,
        },
      });

      return tx.lead.update({
        where: { id: params.id },
        data: {
          status: 'ENVIADO',
          proximoContatoEm: params.proximoContatoEm,
        },
        include: {
          regiao: true,
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
