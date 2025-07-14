

## Hook
```ts
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
```

## Details page Server side props

```tsx

// pages/news/[slug].tsx
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { dehydrate, QueryClient } from 'react-query';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import client from '@/framework/client';
import { API_ENDPOINTS } from '@/framework/client/api-endpoints';
import { useNewsDetails } from '@/hooks/useNewsDetails';
import GeneralLayout from '@/components/layouts/_general';
import Footer from '@/components/layouts/footer';
import dynamic from 'next/dynamic';
import { useTranslation } from 'next-i18next';
import { drawerAtom } from '@/store/drawer-atom';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { FilterIcon } from '@/components/icons/filter-icon';

const MobileNavigation = dynamic(
  () => import('@/components/layouts/mobile-navigation'),
  { ssr: false }
);

export const getServerSideProps: GetServerSideProps = async ({ params, locale }) => {
  const slug = params?.slug as string;
  const language = locale ?? 'en';
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    [API_ENDPOINTS.PAGES, { slug, language }],
    () => client.news.get({ slug, language })
  );

  return {
    props: {
      slug,
      language,
      ...(await serverSideTranslations(language, ['common'])),
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
  };
};

```

## use Data Inside Component

```tsx
// pages/news/[slug].tsx
function SingleNewsPage({
  slug,
  language,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data } = useNewsDetails({ slug, language });

  return (
    <div className="prose block w-full max-w-none">
      <h1 className="mb-4 text-3xl font-bold">{data?.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: data?.description ?? '' }} />
    </div>
  );
}

const GetLayout = (page: React.ReactElement) => {
  const { t } = useTranslation('common');
  const [_, setDrawerView] = useAtom(drawerAtom);

  return (
    <GeneralLayout>
      <>
        <div className="relative block min-h-[400px] w-full bg-light">
          <div className="mx-auto flex w-full max-w-7xl py-10 rtl:space-x-reverse lg:space-x-10 xl:py-14">
            {page}
          </div>
        </div>

        <Footer />

        <MobileNavigation>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() =>
              setDrawerView({
                display: true,
                view: 'SEARCH_FILTER',
              })
            }
            className="flex h-full items-center justify-center p-2 focus:text-accent focus:outline-0"
          >
            <span className="sr-only">{t('text-filter')}</span>
            <FilterIcon width="17.05" height="18" />
          </motion.button>
        </MobileNavigation>
      </>
    </GeneralLayout>
  );
};

SingleNewsPage.getLayout = GetLayout;
export default SingleNewsPage;
```


