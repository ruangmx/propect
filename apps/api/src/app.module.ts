import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EnvModule } from './common/env/env.module.js';
import { IdentityGuard } from './common/guards/identity.guard.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { EventsModule } from './events/events.module.js';
import { HealthModule } from './health/health.module.js';
import { BuscasModule } from './modules/buscas/buscas.module.js';
import { DemosModule } from './modules/demos/demos.module.js';
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
    DemosModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: IdentityGuard,
    },
  ],
})
export class AppModule {}
