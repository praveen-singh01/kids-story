const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const { verifyGoogleIdToken } = require('../../../src/utils/googleAuth');
const { cache } = require('../../../src/loaders/redisLoader');

// Mock dependencies
jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/utils/googleAuth');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateWithGoogle', () => {
    const mockGoogleData = {
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      googleId: 'google123',
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'google',
      roles: ['user'],
    };

    test('should authenticate user with valid Google token', async () => {
      verifyGoogleIdToken.mockResolvedValue(mockGoogleData);
      userRepository.findOrCreate.mockResolvedValue(mockUser);
      cache.set.mockResolvedValue(true);

      const result = await authService.authenticateWithGoogle('valid-token');

      expect(verifyGoogleIdToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findOrCreate).toHaveBeenCalledWith(mockGoogleData);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    test('should throw error for invalid Google token', async () => {
      verifyGoogleIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.authenticateWithGoogle('invalid-token')
      ).rejects.toThrow('Authentication failed');
    });

    test('should sanitize user data in response', async () => {
      const userWithSensitiveData = {
        ...mockUser,
        googleId: 'google123',
        __v: 0,
      };

      verifyGoogleIdToken.mockResolvedValue(mockGoogleData);
      userRepository.findOrCreate.mockResolvedValue(userWithSensitiveData);
      cache.set.mockResolvedValue(true);

      const result = await authService.authenticateWithGoogle('valid-token');

      expect(result.user).not.toHaveProperty('googleId');
      expect(result.user).not.toHaveProperty('__v');
      expect(result.user).toHaveProperty('id');
    });
  });

  describe('refreshAccessToken', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User',
    };

    test('should refresh access token with valid refresh token', async () => {
      const { generateRefreshToken } = require('../../../src/utils/jwt');
      const { token: refreshToken } = generateRefreshToken(mockUser._id.toString());

      cache.isBlacklisted.mockResolvedValue(false);
      cache.get.mockResolvedValue(mockUser._id.toString());
      userRepository.findById.mockResolvedValue(mockUser);
      cache.blacklist.mockResolvedValue(true);
      cache.set.mockResolvedValue(true);

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe(refreshToken); // Should be rotated
    });

    test('should throw error for blacklisted refresh token', async () => {
      const { generateRefreshToken } = require('../../../src/utils/jwt');
      const { token: refreshToken } = generateRefreshToken(mockUser._id.toString());

      cache.isBlacklisted.mockResolvedValue(true);

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Token refresh failed');
    });

    test('should throw error for non-existent refresh token', async () => {
      const { generateRefreshToken } = require('../../../src/utils/jwt');
      const { token: refreshToken } = generateRefreshToken(mockUser._id.toString());

      cache.isBlacklisted.mockResolvedValue(false);
      cache.get.mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Token refresh failed');
    });

    test('should throw error for non-existent user', async () => {
      const { generateRefreshToken } = require('../../../src/utils/jwt');
      const { token: refreshToken } = generateRefreshToken(mockUser._id.toString());

      cache.isBlacklisted.mockResolvedValue(false);
      cache.get.mockResolvedValue(mockUser._id.toString());
      userRepository.findById.mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken(refreshToken)
      ).rejects.toThrow('Token refresh failed');
    });
  });

  describe('logout', () => {
    test('should logout user with valid refresh token', async () => {
      const { generateRefreshToken } = require('../../../src/utils/jwt');
      const { token: refreshToken } = generateRefreshToken('507f1f77bcf86cd799439011');

      cache.blacklist.mockResolvedValue(true);
      cache.del.mockResolvedValue(true);

      const result = await authService.logout(refreshToken);

      expect(result).toBe(true);
      expect(cache.blacklist).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
    });

    test('should not throw error for invalid refresh token', async () => {
      const result = await authService.logout('invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('getUserProfile', () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      name: 'Test User',
      subscription: { plan: 'free', status: 'active' },
    };

    test('should get user profile', async () => {
      userRepository.findWithSubscription.mockResolvedValue(mockUser);

      const result = await authService.getUserProfile(mockUser._id);

      expect(userRepository.findWithSubscription).toHaveBeenCalledWith(mockUser._id);
      expect(result.email).toBe(mockUser.email);
      expect(result).toHaveProperty('id');
      expect(result).not.toHaveProperty('_id');
    });

    test('should throw error for non-existent user', async () => {
      userRepository.findWithSubscription.mockResolvedValue(null);

      await expect(
        authService.getUserProfile('507f1f77bcf86cd799439011')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    const userId = '507f1f77bcf86cd799439011';
    const mockUser = {
      _id: userId,
      email: 'test@example.com',
      name: 'Updated Name',
    };

    test('should update user profile with valid data', async () => {
      userRepository.updateById.mockResolvedValue(mockUser);
      cache.del.mockResolvedValue(true);

      const updateData = { name: 'Updated Name' };
      const result = await authService.updateUserProfile(userId, updateData);

      expect(userRepository.updateById).toHaveBeenCalledWith(userId, updateData);
      expect(cache.del).toHaveBeenCalledWith(`user:${userId}`);
      expect(result.name).toBe('Updated Name');
    });

    test('should filter out invalid fields', async () => {
      userRepository.updateById.mockResolvedValue(mockUser);
      cache.del.mockResolvedValue(true);

      const updateData = { 
        name: 'Updated Name',
        email: 'hacker@evil.com', // Should be filtered out
        roles: ['admin'], // Should be filtered out
      };

      await authService.updateUserProfile(userId, updateData);

      expect(userRepository.updateById).toHaveBeenCalledWith(userId, { name: 'Updated Name' });
    });

    test('should throw error for non-existent user', async () => {
      userRepository.updateById.mockResolvedValue(null);

      await expect(
        authService.updateUserProfile(userId, { name: 'New Name' })
      ).rejects.toThrow('User not found');
    });
  });
});
