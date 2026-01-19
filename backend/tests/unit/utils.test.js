const { generateTicketId, parseTicketId, isValidTicketId } = require('../../src/utils/ticketGenerator');
const { successResponse, errorResponse, validationErrorResponse } = require('../../src/utils/response');

describe('Ticket Generator Utils', () => {
  describe('generateTicketId', () => {
    it('should generate ticket ID with correct format', () => {
      const ticketId = generateTicketId(1);
      expect(ticketId).toMatch(/^AASTU-FIX-\d{8}-0001$/);
    });

    it('should generate different sequence numbers', () => {
      const ticket1 = generateTicketId(1);
      const ticket2 = generateTicketId(2);
      expect(ticket1).not.toBe(ticket2);
      expect(ticket1.endsWith('0001')).toBe(true);
      expect(ticket2.endsWith('0002')).toBe(true);
    });
  });

  describe('parseTicketId', () => {
    it('should parse valid ticket ID correctly', () => {
      const ticketId = 'AASTU-FIX-20240120-0001';
      const parsed = parseTicketId(ticketId);
      
      expect(parsed.sequence).toBe(1);
      expect(parsed.dateString).toBe('20240120');
      expect(parsed.isValid).toBe(true);
    });

    it('should throw error for invalid ticket ID', () => {
      expect(() => parseTicketId('INVALID-ID')).toThrow('Invalid ticket ID format');
    });
  });

  describe('isValidTicketId', () => {
    it('should return true for valid ticket ID', () => {
      expect(isValidTicketId('AASTU-FIX-20240120-0001')).toBe(true);
    });

    it('should return false for invalid ticket ID', () => {
      expect(isValidTicketId('INVALID-ID')).toBe(false);
    });
  });
});

describe('Response Utils', () => {
  describe('successResponse', () => {
    it('should create success response with correct format', () => {
      const response = successResponse('Test message', { test: 'data' });
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Test message');
      expect(response.data).toEqual({ test: 'data' });
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('errorResponse', () => {
    it('should create error response with correct format', () => {
      const response = errorResponse('Test error', 'TEST_ERROR');
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Test error');
      expect(response.error_code).toBe('TEST_ERROR');
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('validationErrorResponse', () => {
    it('should create validation error response', () => {
      const errors = ['Field is required', 'Invalid format'];
      const response = validationErrorResponse(errors);
      
      expect(response.success).toBe(false);
      expect(response.error_code).toBe('VALID_INVALID_INPUT');
      expect(response.data.errors).toEqual(errors);
    });
  });
});