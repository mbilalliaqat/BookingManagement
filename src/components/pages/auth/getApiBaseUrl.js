export function getApiBaseUrl() {
  const isDev = import.meta.env.MODE === 'development';
  return isDev 
    ? import.meta.env.VITE_API_BASE_URL 
    : import.meta.env.VITE_LIVE_API_BASE_URL;
}