import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/prospect_dev',
  });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  console.log('[seed] Banco limpo e pronto para os dados do Prospect.');
  try {
    // Seeds do Prospect serão inseridos na Fase 1 (Regiões de Brasília)
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[seed] ❌ Erro ao popular seed:', error);
  process.exit(1);
});
