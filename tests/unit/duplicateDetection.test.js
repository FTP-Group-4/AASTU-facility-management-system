const duplicateDetectionService = require('../../src/services/duplicateDetectionService');

describe('Duplicate Detection Service', () => {
  describe('Text Similarity Calculations', () => {
    test('should calculate identical text similarity as 1.0', () => {
      const text1 = 'broken air conditioner';
      const text2 = 'broken air conditioner';
      
      const similarity = duplicateDetectionService.calculateTextSimilarity(text1, text2);
      expect(similarity).toBe(1.0);
    });

    test('should calculate completely different text similarity as low', () => {
      const text1 = 'broken air conditioner';
      const text2 = 'leaking water pipe';
      
      const similarity = duplicateDetectionService.calculateTextSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.3);
    });

    test('should calculate similar text with reasonable similarity score', () => {
      const text1 = 'broken air conditioner unit';
      const text2 = 'faulty air conditioning system';
      
      const similarity = duplicateDetectionService.calculateTextSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.2);
      expect(similarity).toBeLessThan(1.0);
    });

    test('should handle empty strings gracefully', () => {
      const text1 = '';
      const text2 = 'some text';
      
      const similarity = duplicateDetectionService.calculateTextSimilarity(text1, text2);
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('should handle null/undefined inputs gracefully', () => {
      const text1 = null;
      const text2 = undefined;
      
      expect(() => {
        duplicateDetectionService.calculateTextSimilarity(text1, text2);
      }).not.toThrow();
    });
  });

  describe('Text Normalization', () => {
    test('should normalize text correctly', () => {
      const text = 'Broken Air-Conditioner!!! Unit #123';
      const normalized = duplicateDetectionService.normalizeText(text);
      
      expect(normalized).toBe('broken air conditioner unit 123');
    });

    test('should handle multiple spaces', () => {
      const text = 'broken    air     conditioner';
      const normalized = duplicateDetectionService.normalizeText(text);
      
      expect(normalized).toBe('broken air conditioner');
    });
  });

  describe('Jaccard Similarity', () => {
    test('should calculate Jaccard similarity correctly', () => {
      const text1 = 'broken air conditioner';
      const text2 = 'faulty air conditioner';
      
      const similarity = duplicateDetectionService.calculateJaccardSimilarity(text1, text2);
      expect(similarity).toBeGreaterThanOrEqual(0.5); // Should share "air conditioner"
    });

    test('should return 1.0 for identical texts', () => {
      const text1 = 'broken air conditioner';
      const text2 = 'broken air conditioner';
      
      const similarity = duplicateDetectionService.calculateJaccardSimilarity(text1, text2);
      expect(similarity).toBe(1.0);
    });
  });

  describe('Levenshtein Distance', () => {
    test('should calculate Levenshtein distance correctly', () => {
      const str1 = 'kitten';
      const str2 = 'sitting';
      
      const distance = duplicateDetectionService.levenshteinDistance(str1, str2);
      expect(distance).toBe(3); // Known result for this example
    });

    test('should return 0 for identical strings', () => {
      const str1 = 'test';
      const str2 = 'test';
      
      const distance = duplicateDetectionService.levenshteinDistance(str1, str2);
      expect(distance).toBe(0);
    });
  });

  describe('N-gram Generation', () => {
    test('should generate bigrams correctly', () => {
      const text = 'test';
      const ngrams = duplicateDetectionService.generateNGrams(text, 2);
      
      expect(ngrams.has('te')).toBe(true);
      expect(ngrams.has('es')).toBe(true);
      expect(ngrams.has('st')).toBe(true);
      expect(ngrams.size).toBe(3);
    });

    test('should handle empty text', () => {
      const text = '';
      const ngrams = duplicateDetectionService.generateNGrams(text, 2);
      
      expect(ngrams.size).toBe(0);
    });
  });

  describe('Warning Message Generation', () => {
    test('should generate appropriate warning for single duplicate', () => {
      const duplicates = [{
        ticket_id: 'AASTU-FIX-20240120-0001',
        status: 'submitted'
      }];
      
      const message = duplicateDetectionService.generateWarningMessage(duplicates);
      expect(message).toContain('AASTU-FIX-20240120-0001');
      expect(message).toContain('submitted');
    });

    test('should generate appropriate warning for multiple duplicates', () => {
      const duplicates = [
        { ticket_id: 'AASTU-FIX-20240120-0001', status: 'submitted' },
        { ticket_id: 'AASTU-FIX-20240120-0002', status: 'under_review' }
      ];
      
      const message = duplicateDetectionService.generateWarningMessage(duplicates);
      expect(message).toContain('2 similar reports');
    });
  });

  describe('Detection Settings', () => {
    test('should update detection settings with defaults', () => {
      const customSettings = {
        similarity_threshold: 0.8,
        time_window_days: 14
      };
      
      const updatedSettings = duplicateDetectionService.updateDetectionSettings(customSettings);
      
      expect(updatedSettings.similarity_threshold).toBe(0.8);
      expect(updatedSettings.time_window_days).toBe(14);
      expect(updatedSettings.max_duplicates_to_check).toBe(10); // Default value
    });
  });
});