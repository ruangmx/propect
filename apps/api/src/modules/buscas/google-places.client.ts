import { Injectable, Logger } from '@nestjs/common';
import { AppErrorCode, DomainError } from '@prospect/shared';
import { EnvService } from '../../common/env/env.service.js';

const PLACES_SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const MAX_PAGES = 3;
const PAGE_SIZE = 20;
const REQUEST_TIMEOUT_MS = 10_000;

const FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

export interface GooglePlaceItem {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
}

interface GooglePlacesApiResponse {
  places?: GooglePlaceItem[];
  nextPageToken?: string;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

export interface GooglePlacesSearchResult {
  places: GooglePlaceItem[];
  chamadasApi: number;
}

@Injectable()
export class GooglePlacesClient {
  private readonly logger = new Logger(GooglePlacesClient.name);

  constructor(private readonly envService: EnvService) {}

  async buscarNegocios(
    texto: string,
    lat: number,
    lng: number,
    raio = 4000
  ): Promise<GooglePlacesSearchResult> {
    const apiKey = this.envService.get('GOOGLE_PLACES_KEY')?.trim();
    if (!apiKey) {
      throw new DomainError(
        'A chave GOOGLE_PLACES_KEY não está configurada no ambiente da API.',
        AppErrorCode.BAD_REQUEST
      );
    }

    const places: GooglePlaceItem[] = [];
    let pageToken: string | undefined;
    let chamadasApi = 0;

    do {
      chamadasApi += 1;

      const body: Record<string, unknown> = {
        textQuery: texto,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        pageSize: PAGE_SIZE,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: raio,
          },
        },
      };

      if (pageToken) {
        body.pageToken = pageToken;
      }

      let response: Response;
      try {
        response = await fetch(PLACES_SEARCH_TEXT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': FIELDS,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro de comunicação com Google Places API';
        this.logger.warn(`Falha de rede/timeout ao consultar Google Places: ${message}`);

        // Se já coletamos resultados nas páginas anteriores, retornamos o que foi obtido sem derrubar a busca
        if (places.length > 0) {
          break;
        }
        throw new DomainError(
          'Não foi possível consultar a Google Places API no momento. Tente novamente em instantes.',
          AppErrorCode.INTERNAL_SERVER_ERROR,
          { reason: message }
        );
      }

      const data = (await response.json()) as GooglePlacesApiResponse;

      if (!response.ok || data.error) {
        const apiMsg = data.error?.message || `HTTP ${response.status}`;
        this.logger.warn(`Erro da Google Places API: ${apiMsg}`);

        if (places.length > 0) {
          break;
        }
        throw new DomainError(
          `Erro retornado pela Google Places API: ${apiMsg}`,
          AppErrorCode.BAD_REQUEST,
          { status: response.status, googleStatus: data.error?.status }
        );
      }

      if (data.places && data.places.length > 0) {
        places.push(...data.places);
      }

      pageToken = data.nextPageToken;
    } while (pageToken && chamadasApi < MAX_PAGES);

    return { places, chamadasApi };
  }
}
