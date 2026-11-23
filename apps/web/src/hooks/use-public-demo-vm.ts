'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppErrorCode, PublicDemoResponse } from '@prospect/shared';
import { ApiClientError } from '@/lib/api-client';
import { obterDemoPublica } from '@/lib/api/prospect.api';

export function usePublicDemoVm(slug: string) {
  const [demo, setDemo] = useState<PublicDemoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const carregar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await obterDemoPublica(slug);
      setDemo(data);
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        (err.status === 404 || err.code === AppErrorCode.NOT_FOUND)
      ) {
        setNotFound(true);
      } else {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível carregar esta demonstração.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      void carregar();
    }
  }, [slug, carregar]);

  return {
    demo,
    isLoading,
    error,
    notFound,
    carregar,
  };
}
