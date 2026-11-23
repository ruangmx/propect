import { Injectable } from '@nestjs/common';
import { LeadStatus, PresencaWeb } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';

export interface CreateLeadFromSearchData {
  placeId: string;
  nome: string;
  nicho: string;
  endereco: string | null;
  regiaoId: string;
  telefone: string | null;
  ehCelular: boolean;
  website: string | null;
  instagram: string | null;
  presencaWeb: PresencaWeb;
  nota: number | null;
  totalAvaliacoes: number | null;
  googleMapsUri: string | null;
  status: LeadStatus;
}

export interface RegistrarBuscaInput {
  nicho: string;
  regiaoId: string;
  totalEncontrado: number;
  totalNovos: number;
  chamadasApi: number;
  leadsNovos: CreateLeadFromSearchData[];
}

@Injectable()
export class BuscasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca placeIds já existentes no banco SEM filtrar deletedAt,
   * garantindo que leads descartados (ex.: LGPD) ou excluídos nunca sejam recriados.
   */
  async findExistingPlaceIds(placeIds: string[]): Promise<Set<string>> {
    if (placeIds.length === 0) return new Set();

    const existing = await this.prisma.lead.findMany({
      where: { placeId: { in: placeIds } },
      select: { placeId: true },
    });

    return new Set(existing.map((item) => item.placeId));
  }

  async registrarBuscaELeads(input: RegistrarBuscaInput) {
    return this.prisma.$transaction(async (tx) => {
      if (input.leadsNovos.length > 0) {
        await tx.lead.createMany({
          data: input.leadsNovos,
          skipDuplicates: true,
        });
      }

      return tx.busca.create({
        data: {
          nicho: input.nicho,
          regiaoId: input.regiaoId,
          totalEncontrado: input.totalEncontrado,
          totalNovos: input.totalNovos,
          chamadasApi: input.chamadasApi,
        },
        include: {
          regiao: true,
        },
      });
    });
  }

  async findRecent(limit = 20) {
    return this.prisma.busca.findMany({
      where: { deletedAt: null },
      include: { regiao: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
