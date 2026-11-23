import { Module } from '@nestjs/common';
import { RegioesModule } from '../regioes/regioes.module.js';
import { BuscasController } from './buscas.controller.js';
import { BuscasRepository } from './buscas.repository.js';
import { BuscasService } from './buscas.service.js';
import { GooglePlacesClient } from './google-places.client.js';

@Module({
  imports: [RegioesModule],
  controllers: [BuscasController],
  providers: [GooglePlacesClient, BuscasRepository, BuscasService],
})
export class BuscasModule {}
