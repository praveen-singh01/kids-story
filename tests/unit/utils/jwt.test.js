const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateM2MToken,
  verifyM2MToken,
} = require('../../../src/utils/jwt');

describe('JWT Utils', () => {
  const testUserId = '507f1f77bcf86cd799439011';

  describe('Access Token', () => {
    test('should generate valid access token', () => {
      const token = generateAccessToken(testUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should verify valid access token', () => {
      const token = generateAccessToken(testUserId);
      const decoded = verifyAccessToken(token);
      
      expect(decoded.sub).toBe(testUserId);
      expect(decoded.type).toBe('access');
      expect(decoded.iss).toBe('bedtime-api');
      expect(decoded.aud).toBe('bedtime-app');
    });

    test('should throw error for invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('Refresh Token', () => {
    test('should generate valid refresh token with jti', () => {
      const result = generateRefreshToken(testUserId);
      
      expect(result.token).toBeDefined();
      expect(result.jti).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(typeof result.jti).toBe('string');
    });

    test('should verify valid refresh token', () => {
      const { token } = generateRefreshToken(testUserId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.sub).toBe(testUserId);
      expect(decoded.type).toBe('refresh');
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBe('bedtime-api');
      expect(decoded.aud).toBe('bedtime-app');
    });

    test('should throw error for invalid refresh token', () => {
      expect(() => {
        verifyRefreshToken('invalid-token');
      }).toThrow();
    });
  });

  describe('M2M Token', () => {
    const issuer = 'core';
    const audience = 'payments';

    test('should generate valid M2M token', () => {
      const token = generateM2MToken(issuer, audience);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should verify valid M2M token', () => {
      const token = generateM2MToken(issuer, audience);
      const decoded = verifyM2MToken(token, issuer, audience);
      
      expect(decoded.iss).toBe(issuer);
      expect(decoded.aud).toBe(audience);
      expect(decoded.iat).toBeDefined();
    });

    test('should throw error for wrong issuer', () => {
      const token = generateM2MToken(issuer, audience);
      
      expect(() => {
        verifyM2MToken(token, 'wrong-issuer', audience);
      }).toThrow('Invalid M2M token issuer or audience');
    });

    test('should throw error for wrong audience', () => {
      const token = generateM2MToken(issuer, audience);
      
      expect(() => {
        verifyM2MToken(token, issuer, 'wrong-audience');
      }).toThrow('Invalid M2M token issuer or audience');
    });

    test('should throw error for invalid M2M token', () => {
      expect(() => {
        verifyM2MToken('invalid-token', issuer, audience);
      }).toThrow();
    });
  });
});
