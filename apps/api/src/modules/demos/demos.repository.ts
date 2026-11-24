import { Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { AppErrorCode, DemoDados, DemoTemplate, DomainError } from '@prospect/shared';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class DemosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLeadForDemo(leadId: string) {
    return this.prisma.lead.findFirst({
      where: { id: leadId, deletedAt: null },
      include: {
        regiao: true,
        demo: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.demo.findFirst({
      where: { id, deletedAt: null },
      include: {
        lead: {
          include: { regiao: true },
        },
      },
    });
  }

  async slugExists(slug: string, excludeLeadId?: string): Promise<boolean> {
    const found = await this.prisma.lead.findFirst({
      where: {
        slug,
        ...(excludeLeadId ? { id: { not: excludeLeadId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  async saveGeneratedDemoAndUpdateLead(params: {
    leadId: string;
    slug: string;
    template: DemoTemplate;
    dados: DemoDados;
    statusAnterior: LeadStatus;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Escrita condicional primeiro: se o lead foi descartado em paralelo, nada é gravado (evita TOCTOU).
      const { count } = await tx.lead.updateMany({
        where: { id: params.leadId, status: params.statusAnterior, deletedAt: null },
        data: { slug: params.slug, status: 'DEMO_PRONTA' },
      });
      if (count === 0) {
        throw new DomainError(
          'O status do lead mudou durante a operação. Atualize a tela e tente novamente.',
          AppErrorCode.CONFLICT
        );
      }

      const demo = await tx.demo.upsert({
        where: { leadId: params.leadId },
        create: {
          leadId: params.leadId,
          template: params.template,
          dados: params.dados as unknown as Prisma.InputJsonValue,
          publicadaEm: new Date(),
        },
        update: {
          template: params.template,
          dados: params.dados as unknown as Prisma.InputJsonValue,
          publicadaEm: new Date(),
          deletedAt: null,
        },
      });

      if (params.statusAnterior !== 'DEMO_PRONTA') {
        await tx.interacao.create({
          data: {
            leadId: params.leadId,
            tipo: 'MUDANCA_STATUS',
            conteudo: `Demo gerada (/demo/${params.slug}) | Status alterado de ${params.statusAnterior} para DEMO_PRONTA`,
          },
        });
      }

      const lead = await tx.lead.findUniqueOrThrow({
        where: { id: params.leadId },
        include: {
          regiao: true,
          demo: true,
          interacoes: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return { demo, lead };
    });
  }

  async updateDemo(
    id: string,
    params: {
      template?: DemoTemplate;
      dados?: DemoDados;
      logoUrl?: string | null;
    }
  ) {
    return this.prisma.demo.update({
      where: { id },
      data: {
        ...(params.template !== undefined ? { template: params.template } : {}),
        ...(params.dados !== undefined
          ? { dados: params.dados as unknown as Prisma.InputJsonValue }
          : {}),
        ...(params.logoUrl !== undefined ? { logoUrl: params.logoUrl } : {}),
      },
    });
  }

  async findPublicBySlugAndIncrementViews(slug: string) {
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: {
          slug,
          deletedAt: null,
          // LGPD: lead descartado (não quer contato) nunca mantém a demo pública.
          status: { not: 'DESCARTADO' },
          demo: {
            is: {
              deletedAt: null,
            },
          },
        },
        select: {
          slug: true,
          nome: true,
          nicho: true,
          endereco: true,
          telefone: true,
          googleMapsUri: true,
          instagram: true,
          nota: true,
          totalAvaliacoes: true,
          regiao: {
            select: { nome: true },
          },
          demo: {
            select: {
              id: true,
              template: true,
              dados: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!lead || !lead.demo) {
        return null;
      }

      const updatedDemo = await tx.demo.update({
        where: { id: lead.demo.id },
        data: {
          visualizacoes: { increment: 1 },
        },
      });

      return { lead, demo: updatedDemo };
    });
  }
}
