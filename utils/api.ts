const PROD_API_BASE_URL = 'https://manzo-be.onrender.com';
const DEV_API_BASE_URL = 'http://localhost:3800';

export const getApiBaseUrl = () =>
  process.env.EXPO_PUBLIC_ENV === 'production' ? PROD_API_BASE_URL : DEV_API_BASE_URL;
