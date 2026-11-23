import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '@prospect/shared';
import { EventsService } from '../../events/events.service.js';
import { RegioesRepository } from '../regioes/regioes.repository.js';
import { BuscasRepository } from './buscas.repository.js';
import { BuscasService } from './buscas.service.js';
import { GooglePlacesClient } from './google-places.client.js';

describe('BuscasService', () => {
  const regiaoAguasClaras = {
    id: 'b0000000-0000-4000-8000-000000000007',
    nome: 'Águas Claras',
    cidade: 'Brasília',
    uf: 'DF',
    lat: -15.8394,
    lng: -48.0264,
    raioMetros: 4000,
    ativa: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  function createService(overrides?: {
    places?: Awaited<ReturnType<GooglePlacesClient['buscarNegocios']>>;
    existingIds?: Set<string>;
    regioes?: typeof regiaoAguasClaras[];
  }) {
    const googlePlacesClient = {
      buscarNegocios: vi.fn().mockResolvedValue(
        overrides?.places ?? {
          chamadasApi: 2,
          places: [
            {
              id: 'place-sem-site-celular',
              displayName: { text: 'Barbearia Dom Pedro' },
              formattedAddress: 'Rua 25 Sul, Águas Claras',
              nationalPhoneNumber: '(61) 99876-5432',
              businessStatus: 'OPERATIONAL',
              rating: 4.8,
              userRatingCount: 120,
              googleMapsUri: 'https://maps.google.com/?cid=1',
            },
            {
              id: 'place-insta-fixo',
              displayName: { text: 'Barbearia Central' },
              formattedAddress: 'Av. Castanheiras, Águas Claras',
              nationalPhoneNumber: '(61) 3322-4455',
              websiteUri: 'https://instagram.com/barbeariacentral',
              businessStatus: 'OPERATIONAL',
              rating: 4.5,
              userRatingCount: 40,
            },
            {
              id: 'place-com-site',
              displayName: { text: 'Barbearia Moderna' },
              websiteUri: 'https://barbeariamoderna.com.br',
              businessStatus: 'OPERATIONAL',
            },
            {
              id: 'place-fechada',
              displayName: { text: 'Barbearia Antiga' },
              businessStatus: 'CLOSED_PERMANENTLY',
            },
            {
              id: 'place-ja-existente',
              displayName: { text: 'Barbearia Duplicada' },
              nationalPhoneNumber: '(61) 99111-2222',
              businessStatus: 'OPERATIONAL',
            },
          ],
        }
      ),
    } as unknown as GooglePlacesClient;

    const buscasRepository = {
      findExistingPlaceIds: vi
        .fn()
        .mockResolvedValue(overrides?.existingIds ?? new Set(['place-ja-existente'])),
      registrarBuscaELeads: vi.fn().mockImplementation(async (input) => ({
        id: 'c0000000-0000-4000-8000-000000000001',
        nicho: input.nicho,
        regiaoId: input.regiaoId,
        regiao: regiaoAguasClaras,
        totalEncontrado: input.totalEncontrado,
        totalNovos: input.totalNovos,
        chamadasApi: input.chamadasApi,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      })),
      findRecent: vi.fn().mockResolvedValue([]),
    } as unknown as BuscasRepository;

    const regioesRepository = {
      findByIds: vi.fn().mockResolvedValue(overrides?.regioes ?? [regiaoAguasClaras]),
    } as unknown as RegioesRepository;

    const eventsService = {
      publish: vi.fn(),
    } as unknown as EventsService;

    const service = new BuscasService(
      googlePlacesClient,
      buscasRepository,
      regioesRepository,
      eventsService
    );

    return { service, googlePlacesClient, buscasRepository, eventsService };
  }

  it('classifica, filtra sites próprios/fechados, deduplica placeId e define NOVO vs LIGAR', async () => {
    const { service, buscasRepository, eventsService } = createService();

    const result = await service.executarBusca({
      nicho: 'barbearia',
      regiaoIds: [regiaoAguasClaras.id],
    });

    expect(result.totalEncontrado).toBe(5);
    expect(result.totalDescartados).toBe(1);
    expect(result.totalComSiteProprio).toBe(1);
    expect(result.totalSemSiteOuRede).toBe(3);
    expect(result.totalDuplicados).toBe(1);
    expect(result.totalNovos).toBe(2);
    expect(result.chamadasApi).toBe(2);

    const salvarCall = vi.mocked(buscasRepository.registrarBuscaELeads).mock.calls[0]?.[0];
    expect(salvarCall?.leadsNovos).toHaveLength(2);
    expect(salvarCall?.leadsNovos[0]).toMatchObject({
      placeId: 'place-sem-site-celular',
      presencaWeb: 'SEM_SITE',
      ehCelular: true,
      status: 'NOVO',
    });
    expect(salvarCall?.leadsNovos[1]).toMatchObject({
      placeId: 'place-insta-fixo',
      presencaWeb: 'SO_REDE_SOCIAL',
      instagram: 'https://instagram.com/barbeariacentral',
      ehCelular: false,
      status: 'LIGAR',
    });

    expect(eventsService.publish).toHaveBeenCalledWith('buscas.concluida', {
      nicho: 'barbearia',
      totalNovos: 2,
      chamadasApi: 2,
    });
  });

  it('lança DomainError quando nenhuma região ativa é encontrada', async () => {
    const { service } = createService({ regioes: [] });

    await expect(
      service.executarBusca({
        nicho: 'barbearia',
        regiaoIds: ['b0000000-0000-4000-8000-000000000099'],
      })
    ).rejects.toBeInstanceOf(DomainError);
  });
});
