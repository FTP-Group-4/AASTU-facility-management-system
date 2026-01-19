/**
 * Ticket ID generation utility
 * Format: AASTU-FIX-{YYYYMMDD}-{0001}
 */

/**
 * Generate a unique ticket ID
 * @param {number} sequenceNumber - Sequential number for the day
 * @returns {string} Formatted ticket ID
 */
const generateTicketId = (sequenceNumber = 1) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const dateString = `${year}${month}${day}`;
  const sequence = String(sequenceNumber).padStart(4, '0');
  
  return `AASTU-FIX-${dateString}-${sequence}`;
};

/**
 * Parse ticket ID to extract date and sequence
 * @param {string} ticketId - Ticket ID to parse
 * @returns {object} Parsed ticket information
 */
const parseTicketId = (ticketId) => {
  const regex = /^AASTU-FIX-(\d{8})-(\d{4})$/;
  const match = ticketId.match(regex);
  
  if (!match) {
    throw new Error('Invalid ticket ID format');
  }
  
  const [, dateString, sequenceString] = match;
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateString.substring(6, 8));
  const sequence = parseInt(sequenceString);
  
  return {
    date: new Date(year, month, day),
    sequence,
    dateString,
    isValid: true
  };
};

/**
 * Validate ticket ID format
 * @param {string} ticketId - Ticket ID to validate
 * @returns {boolean} True if valid format
 */
const isValidTicketId = (ticketId) => {
  try {
    parseTicketId(ticketId);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateTicketId,
  parseTicketId,
  isValidTicketId
};