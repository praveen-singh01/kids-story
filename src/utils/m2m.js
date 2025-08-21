const { generateM2MToken } = require('./jwt');
const config = require('../config');

/**
 * Generate M2M token for calling payments service
 * @returns {string} JWT token for payments service
 */
function generatePaymentsToken() {
  return generateM2MToken(config.payments.coreIss, config.payments.coreAudPayments);
}

module.exports = {
  generatePaymentsToken,
};
