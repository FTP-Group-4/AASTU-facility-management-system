const notificationService = require('../services/notificationService');

/**
 * Background job scheduler for SLA monitoring and notification cleanup
 */
class Scheduler {
  constructor() {
    this.intervals = new Map();
    this.isRunning = false;
  }

  /**
   * Start all background jobs
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting background job scheduler...');
    this.isRunning = true;

    // SLA violation check - every 30 minutes
    this.scheduleJob('sla-check', this.checkSLAViolations.bind(this), 30 * 60 * 1000);

    // Notification cleanup - every 24 hours
    this.scheduleJob('notification-cleanup', this.cleanupNotifications.bind(this), 24 * 60 * 60 * 1000);

    console.log('Background jobs started successfully');
  }

  /**
   * Stop all background jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping background job scheduler...');
    
    for (const [jobName, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`Stopped job: ${jobName}`);
    }

    this.intervals.clear();
    this.isRunning = false;
    console.log('Background jobs stopped successfully');
  }

  /**
   * Schedule a recurring job
   * @param {string} jobName - Job identifier
   * @param {Function} jobFunction - Function to execute
   * @param {number} intervalMs - Interval in milliseconds
   */
  scheduleJob(jobName, jobFunction, intervalMs) {
    if (this.intervals.has(jobName)) {
      console.log(`Job ${jobName} is already scheduled`);
      return;
    }

    // Run immediately on start
    this.runJobSafely(jobName, jobFunction);

    // Schedule recurring execution
    const intervalId = setInterval(() => {
      this.runJobSafely(jobName, jobFunction);
    }, intervalMs);

    this.intervals.set(jobName, intervalId);
    console.log(`Scheduled job: ${jobName} (interval: ${intervalMs}ms)`);
  }

  /**
   * Run a job with error handling
   * @param {string} jobName - Job identifier
   * @param {Function} jobFunction - Function to execute
   */
  async runJobSafely(jobName, jobFunction) {
    try {
      console.log(`Running job: ${jobName}`);
      const startTime = Date.now();
      
      await jobFunction();
      
      const duration = Date.now() - startTime;
      console.log(`Job ${jobName} completed in ${duration}ms`);
    } catch (error) {
      console.error(`Error in job ${jobName}:`, error);
    }
  }

  /**
   * SLA violation check job
   */
  async checkSLAViolations() {
    try {
      const violationsFound = await notificationService.checkSLAViolations();
      console.log(`SLA check completed. ${violationsFound} violations found.`);
    } catch (error) {
      console.error('Error in SLA violation check job:', error);
    }
  }

  /**
   * Notification cleanup job
   */
  async cleanupNotifications() {
    try {
      const deletedCount = await notificationService.deleteOldNotifications(30);
      console.log(`Notification cleanup completed. ${deletedCount} old notifications deleted.`);
    } catch (error) {
      console.error('Error in notification cleanup job:', error);
    }
  }

  /**
   * Get scheduler status
   * @returns {object} Scheduler status
   */
  getStatus() {
    return {
      is_running: this.isRunning,
      active_jobs: Array.from(this.intervals.keys()),
      job_count: this.intervals.size
    };
  }
}

// Create singleton instance
const scheduler = new Scheduler();

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping scheduler...');
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;