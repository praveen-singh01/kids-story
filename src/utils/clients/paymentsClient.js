const axios = require('axios');
const config = require('../../config');
const { generatePaymentsToken } = require('../m2m');
const logger = require('../logger');

/**
 * Axios client for payments service with M2M authentication
 */
const paymentsClient = axios.create({
  baseURL: config.payments.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add M2M token to all requests
paymentsClient.interceptors.request.use((config) => {
  const token = generatePaymentsToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log requests and responses
paymentsClient.interceptors.request.use((config) => {
  logger.info({
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
  }, 'Payments API request');
  return config;
});

paymentsClient.interceptors.response.use(
  (response) => {
    logger.info({
      status: response.status,
      url: response.config.url,
    }, 'Payments API response');
    return response;
  },
  (error) => {
    logger.error({
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    }, 'Payments API error');
    return Promise.reject(error);
  }
);

module.exports = paymentsClient;
