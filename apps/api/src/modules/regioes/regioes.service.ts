import { Injectable } from '@nestjs/common';
import { RegioesRepository } from './regioes.repository.js';

@Injectable()
export class RegioesService {
  constructor(private readonly repository: RegioesRepository) {}

  async listarAtivas() {
    return this.repository.findAllAtivas();
  }
}
