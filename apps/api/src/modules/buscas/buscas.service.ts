import { Injectable } from '@nestjs/common';
import {
  AppErrorCode,
  CreateBuscaInput,
  CreateBuscaResult,
  DomainError,
  classificar,
  ehCelular,
  extrairInstagram,
} from '@prospect/shared';
import { EventsService } from '../../events/events.service.js';
import { RegioesRepository } from '../regioes/regioes.repository.js';
import { BuscasRepository, CreateLeadFromSearchData } from './buscas.repository.js';
import { GooglePlacesClient } from './google-places.client.js';

@Injectable()
export class BuscasService {
  constructor(
    private readonly googlePlacesClient: GooglePlacesClient,
    private readonly buscasRepository: BuscasRepository,
    private readonly regioesRepository: RegioesRepository,
    private readonly eventsService: EventsService
  ) {}

  async listarRecentes() {
    return this.buscasRepository.findRecent(20);
  }

  async executarBusca(input: CreateBuscaInput): Promise<CreateBuscaResult> {
    const nicho = input.nicho.trim();
    const regioes = await this.regioesRepository.findByIds(input.regiaoIds);

    if (regioes.length === 0) {
      throw new DomainError(
        'Nenhuma das regiões selecionadas foi encontrada ou está ativa.',
        AppErrorCode.BAD_REQUEST
      );
    }

    let totalEncontrado = 0;
    let totalSemSiteOuRede = 0;
    let totalNovos = 0;
    let totalDuplicados = 0;
    let totalComSiteProprio = 0;
    let totalDescartados = 0;
    let chamadasApiTotal = 0;
    const buscasCriadas = [];

    // Controla placeIds já vistos entre diferentes regiões da mesma execução
    const placeIdsProcessadosNaExecucao = new Set<string>();

    for (const regiao of regioes) {
      const textoBusca = `${nicho} ${regiao.nome} ${regiao.cidade}`;
      const { places, chamadasApi } = await this.googlePlacesClient.buscarNegocios(
        textoBusca,
        regiao.lat,
        regiao.lng,
        regiao.raioMetros
      );

      chamadasApiTotal += chamadasApi;
      totalEncontrado += places.length;

      const candidatos: Array<{
        placeId: string;
        data: CreateLeadFromSearchData;
      }> = [];

      for (const place of places) {
        if (!place.id || !place.displayName?.text) {
          totalDescartados += 1;
          continue;
        }

        const classificacao = classificar({
          businessStatus: place.businessStatus,
          websiteUri: place.websiteUri,
        });

        if (classificacao === 'DESCARTAR') {
          totalDescartados += 1;
          continue;
        }

        if (classificacao === 'TEM_SITE') {
          totalComSiteProprio += 1;
          continue;
        }

        totalSemSiteOuRede += 1;

        if (placeIdsProcessadosNaExecucao.has(place.id)) {
          totalDuplicados += 1;
          continue;
        }

        const telefone = place.nationalPhoneNumber?.trim() || null;
        const celular = ehCelular(telefone);

        candidatos.push({
          placeId: place.id,
          data: {
            placeId: place.id,
            nome: place.displayName.text.trim(),
            nicho,
            endereco: place.formattedAddress?.trim() || null,
            regiaoId: regiao.id,
            telefone,
            ehCelular: celular,
            website: place.websiteUri?.trim() || null,
            instagram: extrairInstagram(place.websiteUri),
            presencaWeb: classificacao,
            nota: typeof place.rating === 'number' ? place.rating : null,
            totalAvaliacoes:
              typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
            googleMapsUri: place.googleMapsUri?.trim() || null,
            status: celular ? 'NOVO' : 'LIGAR',
          },
        });
      }

      const existentesNoBanco = await this.buscasRepository.findExistingPlaceIds(
        candidatos.map((c) => c.placeId)
      );

      const leadsNovos: CreateLeadFromSearchData[] = [];
      for (const candidato of candidatos) {
        if (existentesNoBanco.has(candidato.placeId)) {
          totalDuplicados += 1;
          continue;
        }

        placeIdsProcessadosNaExecucao.add(candidato.placeId);
        leadsNovos.push(candidato.data);
      }

      totalNovos += leadsNovos.length;

      const busca = await this.buscasRepository.registrarBuscaELeads({
        nicho,
        regiaoId: regiao.id,
        totalEncontrado: places.length,
        totalNovos: leadsNovos.length,
        chamadasApi,
        leadsNovos,
      });

      buscasCriadas.push(busca);
    }

    const resultado: CreateBuscaResult = {
      nicho,
      totalRegioes: regioes.length,
      totalEncontrado,
      totalSemSiteOuRede,
      totalNovos,
      totalDuplicados,
      totalComSiteProprio,
      totalDescartados,
      chamadasApi: chamadasApiTotal,
      buscas: buscasCriadas,
    };

    this.eventsService.publish('buscas.concluida', {
      nicho,
      totalNovos,
      chamadasApi: chamadasApiTotal,
    });

    return resultado;
  }
}
