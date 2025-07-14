// hooks/useNewsDetails.ts
import { useQuery } from 'react-query';
import client from '@/framework/client';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';

type Params = {
  slug: string;
  language: string;
};

export const useNewsDetails = ({ slug, language }: Params) => {
  return useQuery(
    [API_ENDPOINTS.PAGES, { slug, language }],
    () => client.news.get({ slug, language }),
    {
      staleTime: 1000 * 60 * 5, // 5 mins
    }
  );
};
