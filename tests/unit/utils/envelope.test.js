const { success, error, validationError } = require('../../../src/utils/envelope');

describe('Envelope Utils', () => {
  describe('success', () => {
    test('should create success envelope with data', () => {
      const data = { id: 1, name: 'test' };
      const message = 'Success message';
      
      const result = success(data, message);
      
      expect(result).toEqual({
        success: true,
        data,
        error: [],
        message,
      });
    });

    test('should create success envelope with null data', () => {
      const result = success();
      
      expect(result).toEqual({
        success: true,
        data: null,
        error: [],
        message: '',
      });
    });

    test('should create success envelope with empty message', () => {
      const data = { test: true };
      
      const result = success(data);
      
      expect(result).toEqual({
        success: true,
        data,
        error: [],
        message: '',
      });
    });
  });

  describe('error', () => {
    test('should create error envelope with single error', () => {
      const errorCode = 'VALIDATION_ERROR';
      const message = 'Validation failed';
      
      const result = error(errorCode, message);
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: [errorCode],
        message,
      });
    });

    test('should create error envelope with multiple errors', () => {
      const errors = ['ERROR_1', 'ERROR_2'];
      const message = 'Multiple errors occurred';
      
      const result = error(errors, message);
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: errors,
        message,
      });
    });

    test('should create error envelope with default message', () => {
      const errorCode = 'UNKNOWN_ERROR';
      
      const result = error(errorCode);
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: [errorCode],
        message: 'An error occurred',
      });
    });

    test('should create error envelope with data', () => {
      const errorCode = 'PARTIAL_ERROR';
      const message = 'Partial failure';
      const data = { processed: 5, failed: 2 };
      
      const result = error(errorCode, message, data);
      
      expect(result).toEqual({
        success: false,
        data,
        error: [errorCode],
        message,
      });
    });
  });

  describe('validationError', () => {
    test('should create validation error envelope from Zod errors', () => {
      const zodErrors = {
        issues: [
          {
            path: ['name'],
            code: 'too_small',
            message: 'Name is required',
          },
          {
            path: ['email'],
            code: 'invalid_string',
            message: 'Invalid email format',
          },
        ],
      };
      
      const result = validationError(zodErrors);
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: [
          {
            field: 'name',
            code: 'too_small',
            message: 'Name is required',
          },
          {
            field: 'email',
            code: 'invalid_string',
            message: 'Invalid email format',
          },
        ],
        message: 'Validation failed',
      });
    });

    test('should handle nested field paths', () => {
      const zodErrors = {
        issues: [
          {
            path: ['user', 'profile', 'age'],
            code: 'too_small',
            message: 'Age must be at least 18',
          },
        ],
      };
      
      const result = validationError(zodErrors);
      
      expect(result.error[0].field).toBe('user.profile.age');
    });

    test('should handle validation errors without issues', () => {
      const zodErrors = {};
      
      const result = validationError(zodErrors);
      
      expect(result).toEqual({
        success: false,
        data: null,
        error: ['VALIDATION_ERROR'],
        message: 'Validation failed',
      });
    });
  });
});
