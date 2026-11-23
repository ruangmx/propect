import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class RegioesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllAtivas() {
    return this.prisma.regiao.findMany({
      where: { ativa: true, deletedAt: null },
      orderBy: { nome: 'asc' },
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.regiao.findMany({
      where: {
        id: { in: ids },
        ativa: true,
        deletedAt: null,
      },
      orderBy: { nome: 'asc' },
    });
  }
}
