import { Injectable } from '@nestjs/common';
import { EnvConfig, validateEnv } from './env.schema.js';

@Injectable()
export class EnvService {
  private readonly config: EnvConfig;

  constructor() {
    this.config = validateEnv();
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }
}
