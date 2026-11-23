import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvModule } from './common/env/env.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { EventsModule } from './events/events.module.js';
import { HealthModule } from './health/health.module.js';
import { BuscasModule } from './modules/buscas/buscas.module.js';
import { LeadsModule } from './modules/leads/leads.module.js';
import { RegioesModule } from './modules/regioes/regioes.module.js';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 requisições por minuto por IP
      },
    ]),
    HealthModule,
    EventsModule,
    RegioesModule,
    BuscasModule,
    LeadsModule,
  ],
})
export class AppModule {}
