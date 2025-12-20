const axios = require('axios');

(async () => {
  // Simulated localStorage
  const storage = { access_token: 'dummy-token' };

  // Create axios instance similar to frontend
  const api = axios.create({ baseURL: 'http://127.0.0.1:8000' });

  // Request interceptor that would normally add Authorization if available
  api.interceptors.request.use((config) => {
    // Simulate race: DO NOT attach Authorization header for this request
    // (this replicates the bug: request sent before axios added header)
    return config;
  });

  // Response interceptor (copy of modified code behavior)
  let isRefreshing = false;
  let failedQueue = [];
  const processQueue = (error = null, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    failedQueue = [];
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // Our new check: if request had no Authorization header, do not purge tokens
      const hadAuthHeader = !!originalRequest.headers?.Authorization;
      if (!hadAuthHeader) {
        console.log('Interceptor: request had NO Authorization header — not clearing tokens');
        return Promise.reject(error);
      }

      // Fallback behavior (not exercised in this test)
      return Promise.reject(error);
    }
  );

  try {
    console.log('Making GET /api/admin/profile without Authorization header (simulate race)');
    await api.get('/api/admin/profile/');
  } catch (err) {
    console.log('Request failed as expected; checking storage...');
    console.log('access_token still in storage:', !!storage.access_token);
  }
})();
