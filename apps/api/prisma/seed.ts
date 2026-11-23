import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const REGIOES_BRASILIA = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    nome: 'Asa Sul',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8267,
    lng: -47.9089,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    nome: 'Asa Norte',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.7601,
    lng: -47.8878,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    nome: 'Sudoeste',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.7997,
    lng: -47.9261,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    nome: 'Lago Sul',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8408,
    lng: -47.8689,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000005',
    nome: 'Lago Norte',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.7369,
    lng: -47.8558,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000006',
    nome: 'Guará',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8236,
    lng: -47.9792,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000007',
    nome: 'Águas Claras',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8394,
    lng: -48.0264,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000008',
    nome: 'Taguatinga',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8331,
    lng: -48.0564,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000009',
    nome: 'Vicente Pires',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8031,
    lng: -48.0306,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000010',
    nome: 'Ceilândia',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.82,
    lng: -48.1139,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000011',
    nome: 'Samambaia',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8769,
    lng: -48.0853,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000012',
    nome: 'Gama',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -16.0169,
    lng: -48.065,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000013',
    nome: 'Sobradinho',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.6531,
    lng: -47.7925,
    raioMetros: 4000,
    ativa: true,
  },
  {
    id: 'b0000000-0000-4000-8000-000000000014',
    nome: 'Planaltina',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.6197,
    lng: -47.6536,
    raioMetros: 4000,
    ativa: true,
  },
];

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prospect_dev',
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  console.log('[seed] Populando regiões iniciais de Brasília (DF)...');
  try {
    for (const regiao of REGIOES_BRASILIA) {
      await prisma.regiao.upsert({
        where: {
          nome_cidade_uf: {
            nome: regiao.nome,
            cidade: regiao.cidade,
            uf: regiao.uf,
          },
        },
        create: regiao,
        update: {
          lat: regiao.lat,
          lng: regiao.lng,
          raioMetros: regiao.raioMetros,
          ativa: regiao.ativa,
          deletedAt: null,
        },
      });
    }
    console.log(`[seed] ✅ ${REGIOES_BRASILIA.length} regiões de Brasília verificadas/populadas.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[seed] ❌ Erro ao popular seed:', error);
  process.exit(1);
});
