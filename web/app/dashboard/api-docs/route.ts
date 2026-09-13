import { ApiReference } from '@scalar/nextjs-api-reference';

export const GET = ApiReference({
  url: '/openapi.json',
  pageTitle: 'AURA API Documentation',
  theme: 'purple',
});
