const prisma = require('../config/database');

class DuplicateDetectionService {
  /**
   * Check for duplicate reports based on location, equipment, and problem description
   * @param {object} reportData - Report data to check for duplicates
   * @returns {Promise<object>} Duplicate detection result with warnings and similar reports
   */
  async checkForDuplicates(reportData) {
    try {
      const { location, equipment_description, problem_description, category } = reportData;

      // Only check for duplicates in specific locations with block information
      if (location.type !== 'specific' || !location.block_id) {
        return {
          has_duplicates: false,
          duplicates: [],
          warning_message: null
        };
      }

      // Find potential duplicate reports
      const potentialDuplicates = await this.findPotentialDuplicates(
        location.block_id,
        location.room_number,
        equipment_description,
        problem_description,
        category
      );

      if (potentialDuplicates.length === 0) {
        return {
          has_duplicates: false,
          duplicates: [],
          warning_message: null
        };
      }

      // Calculate similarity scores and filter high-confidence duplicates
      const duplicatesWithScores = await this.calculateSimilarityScores(
        equipment_description,
        problem_description,
        potentialDuplicates
      );

      // Filter duplicates above threshold
      const highConfidenceDuplicates = duplicatesWithScores.filter(
        duplicate => duplicate.similarity_score >= 0.7
      );

      if (highConfidenceDuplicates.length === 0) {
        return {
          has_duplicates: false,
          duplicates: duplicatesWithScores.filter(d => d.similarity_score >= 0.5), // Show lower confidence matches
          warning_message: null
        };
      }

      // Generate warning message
      const warningMessage = this.generateWarningMessage(highConfidenceDuplicates);

      return {
        has_duplicates: true,
        duplicates: highConfidenceDuplicates,
        warning_message: warningMessage,
        allow_anyway: true // Allow user to submit anyway
      };

    } catch (error) {
      console.error('Error in duplicate detection:', error);
      // Don't block report submission if duplicate detection fails
      return {
        has_duplicates: false,
        duplicates: [],
        warning_message: null,
        error: 'Duplicate detection temporarily unavailable'
      };
    }
  }

  /**
   * Find potential duplicate reports in the database
   * @param {number} blockId - Block ID
   * @param {string} roomNumber - Room number (optional)
   * @param {string} equipmentDescription - Equipment description
   * @param {string} problemDescription - Problem description
   * @param {string} category - Report category
   * @returns {Promise<array>} Array of potential duplicate reports
   */
  async findPotentialDuplicates(blockId, roomNumber, equipmentDescription, problemDescription, category) {
    try {
      // Search for reports in the same location that are not completed/closed
      const whereCondition = {
        block_id: blockId,
        category,
        status: {
          notIn: ['completed', 'closed', 'rejected']
        },
        // Look for reports created in the last 30 days to avoid very old duplicates
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      };

      // Add room number condition if provided
      if (roomNumber) {
        whereCondition.room_number = roomNumber;
      }

      const reports = await prisma.report.findMany({
        where: whereCondition,
        include: {
          submitter: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          block: {
            select: {
              block_number: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 10 // Limit to 10 most recent potential duplicates
      });

      return reports;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate similarity scores between new report and existing reports
   * @param {string} newEquipmentDesc - New report equipment description
   * @param {string} newProblemDesc - New report problem description
   * @param {array} existingReports - Array of existing reports
   * @returns {Promise<array>} Reports with similarity scores
   */
  async calculateSimilarityScores(newEquipmentDesc, newProblemDesc, existingReports) {
    const reportsWithScores = existingReports.map(report => {
      // Ensure we have valid strings for comparison
      const safeNewEquipmentDesc = (newEquipmentDesc || '').toString();
      const safeNewProblemDesc = (newProblemDesc || '').toString();
      const safeExistingEquipmentDesc = (report.equipment_description || '').toString();
      const safeExistingProblemDesc = (report.problem_description || '').toString();

      // Calculate equipment description similarity
      const equipmentSimilarity = this.calculateTextSimilarity(
        safeNewEquipmentDesc.toLowerCase(),
        safeExistingEquipmentDesc.toLowerCase()
      );

      // Calculate problem description similarity
      const problemSimilarity = this.calculateTextSimilarity(
        safeNewProblemDesc.toLowerCase(),
        safeExistingProblemDesc.toLowerCase()
      );

      // Combined similarity score (weighted average)
      const combinedScore = (equipmentSimilarity * 0.6) + (problemSimilarity * 0.4);

      return {
        report_id: report.id,
        ticket_id: report.ticket_id,
        equipment_description: report.equipment_description,
        problem_description: report.problem_description,
        status: report.status,
        priority: report.priority,
        submitted_by: report.submitter.full_name,
        submitted_by_email: report.submitter.email,
        created_at: report.created_at,
        block_number: report.block.block_number,
        room_number: report.room_number,
        similarity_score: Math.round(combinedScore * 100) / 100, // Round to 2 decimal places
        equipment_similarity: Math.round(equipmentSimilarity * 100) / 100,
        problem_similarity: Math.round(problemSimilarity * 100) / 100
      };
    });

    // Sort by similarity score (highest first)
    return reportsWithScores.sort((a, b) => b.similarity_score - a.similarity_score);
  }

  /**
   * Calculate text similarity using multiple algorithms
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    // Normalize texts
    const normalizedText1 = this.normalizeText(text1);
    const normalizedText2 = this.normalizeText(text2);

    // If texts are identical after normalization
    if (normalizedText1 === normalizedText2) {
      return 1.0;
    }

    // Calculate Jaccard similarity (word-based)
    const jaccardScore = this.calculateJaccardSimilarity(normalizedText1, normalizedText2);

    // Calculate Levenshtein similarity (character-based)
    const levenshteinScore = this.calculateLevenshteinSimilarity(normalizedText1, normalizedText2);

    // Calculate n-gram similarity
    const ngramScore = this.calculateNGramSimilarity(normalizedText1, normalizedText2, 2);

    // Weighted combination of different similarity measures
    const combinedScore = (jaccardScore * 0.4) + (levenshteinScore * 0.3) + (ngramScore * 0.3);

    return Math.min(1.0, Math.max(0.0, combinedScore));
  }

  /**
   * Normalize text for comparison
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Calculate Jaccard similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Jaccard similarity score (0-1)
   */
  calculateJaccardSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 2));

    if (words1.size === 0 && words2.size === 0) {
      return 1.0;
    }

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate Levenshtein similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} Levenshtein similarity score (0-1)
   */
  calculateLevenshteinSimilarity(text1, text2) {
    const maxLength = Math.max(text1.length, text2.length);
    if (maxLength === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(text1, text2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate n-gram similarity between two texts
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @param {number} n - N-gram size
   * @returns {number} N-gram similarity score (0-1)
   */
  calculateNGramSimilarity(text1, text2, n = 2) {
    const ngrams1 = this.generateNGrams(text1, n);
    const ngrams2 = this.generateNGrams(text2, n);

    if (ngrams1.size === 0 && ngrams2.size === 0) {
      return 1.0;
    }

    const intersection = new Set([...ngrams1].filter(ngram => ngrams2.has(ngram)));
    const union = new Set([...ngrams1, ...ngrams2]);

    return intersection.size / union.size;
  }

  /**
   * Generate n-grams from text
   * @param {string} text - Input text
   * @param {number} n - N-gram size
   * @returns {Set} Set of n-grams
   */
  generateNGrams(text, n) {
    const ngrams = new Set();
    const cleanText = text.replace(/\s+/g, '');

    for (let i = 0; i <= cleanText.length - n; i++) {
      ngrams.add(cleanText.substring(i, i + n));
    }

    return ngrams;
  }

  /**
   * Generate warning message for duplicate reports
   * @param {array} duplicates - Array of duplicate reports
   * @returns {string} Warning message
   */
  generateWarningMessage(duplicates) {
    if (duplicates.length === 1) {
      const duplicate = duplicates[0];
      return `A similar report (${duplicate.ticket_id}) was already submitted for this location. ` +
             `The existing report is currently "${duplicate.status}". ` +
             `Please check if this is the same issue before submitting.`;
    } else {
      return `${duplicates.length} similar reports have been found for this location. ` +
             `Please review the existing reports to avoid duplicates. ` +
             `You can still submit if this is a different issue.`;
    }
  }

  /**
   * Record duplicate relationship in database
   * @param {string} originalReportId - Original report ID
   * @param {string} duplicateReportId - Duplicate report ID
   * @param {number} similarityScore - Similarity score
   * @returns {Promise<object>} Created duplicate record
   */
  async recordDuplicate(originalReportId, duplicateReportId, similarityScore) {
    try {
      const duplicateRecord = await prisma.duplicateReport.create({
        data: {
          original_report_id: originalReportId,
          duplicate_report_id: duplicateReportId,
          similarity_score: similarityScore
        }
      });

      return duplicateRecord;
    } catch (error) {
      // Handle unique constraint violation (duplicate already recorded)
      if (error.code === 'P2002') {
        console.log('Duplicate relationship already exists');
        return null;
      }
      throw error;
    }
  }

  /**
   * Get duplicate reports for a given report
   * @param {string} reportId - Report ID
   * @returns {Promise<array>} Array of related duplicate reports
   */
  async getDuplicateReports(reportId) {
    try {
      const duplicates = await prisma.duplicateReport.findMany({
        where: {
          OR: [
            { original_report_id: reportId },
            { duplicate_report_id: reportId }
          ]
        },
        include: {
          original_report: {
            select: {
              id: true,
              ticket_id: true,
              equipment_description: true,
              status: true,
              created_at: true,
              submitter: {
                select: {
                  full_name: true
                }
              }
            }
          }
        }
      });

      return duplicates.map(duplicate => ({
        duplicate_id: duplicate.id,
        related_report_id: duplicate.original_report_id === reportId 
          ? duplicate.duplicate_report_id 
          : duplicate.original_report_id,
        related_ticket_id: duplicate.original_report.ticket_id,
        similarity_score: duplicate.similarity_score,
        equipment_description: duplicate.original_report.equipment_description,
        status: duplicate.original_report.status,
        submitted_by: duplicate.original_report.submitter.full_name,
        created_at: duplicate.original_report.created_at,
        relationship_created_at: duplicate.created_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update duplicate detection settings (for admin configuration)
   * @param {object} settings - Detection settings
   * @returns {object} Updated settings
   */
  updateDetectionSettings(settings) {
    // This could be stored in database or configuration
    // For now, return the settings as they would be applied
    const defaultSettings = {
      similarity_threshold: 0.7,
      time_window_days: 30,
      max_duplicates_to_check: 10,
      enable_equipment_matching: true,
      enable_problem_matching: true,
      jaccard_weight: 0.4,
      levenshtein_weight: 0.3,
      ngram_weight: 0.3
    };

    return { ...defaultSettings, ...settings };
  }
}

module.exports = new DuplicateDetectionService();