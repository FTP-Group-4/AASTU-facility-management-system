const prisma = require('../config/database');

class BlockService {
  /**
   * Get all blocks with optional filtering
   * @param {object} filters - Filter options
   * @returns {Promise<object>} Blocks with pagination
   */
  async getAllBlocks(filters = {}) {
    try {
      const { page = 1, limit = 50, search } = filters;
      
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { block_number: { equals: parseInt(search) || -1 } }
        ];
      }

      const [blocks, total] = await Promise.all([
        prisma.block.findMany({
          where,
          include: {
            coordinator_assignments: {
              include: {
                coordinator: {
                  select: {
                    id: true,
                    full_name: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                reports: true
              }
            }
          },
          orderBy: { block_number: 'asc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.block.count({ where })
      ]);

      // Transform the data to include coordinator info
      const transformedBlocks = blocks.map(block => ({
        id: block.id,
        block_number: block.block_number,
        name: block.name,
        description: block.description,
        coordinators: block.coordinator_assignments.map(assignment => assignment.coordinator),
        report_count: block._count.reports,
        created_at: block.created_at,
        updated_at: block.updated_at
      }));

      return {
        blocks: transformedBlocks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get block by ID
   * @param {number} blockId - Block ID
   * @returns {Promise<object>} Block data
   */
  async getBlockById(blockId) {
    try {
      const block = await prisma.block.findUnique({
        where: { id: parseInt(blockId) },
        include: {
          coordinator_assignments: {
            include: {
              coordinator: {
                select: {
                  id: true,
                  full_name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          reports: {
            select: {
              id: true,
              ticket_id: true,
              status: true,
              priority: true,
              created_at: true
            },
            orderBy: { created_at: 'desc' },
            take: 10 // Latest 10 reports
          },
          _count: {
            select: {
              reports: true
            }
          }
        }
      });

      if (!block) {
        throw new Error('Block not found');
      }

      return {
        id: block.id,
        block_number: block.block_number,
        name: block.name,
        description: block.description,
        coordinators: block.coordinator_assignments.map(assignment => assignment.coordinator),
        recent_reports: block.reports,
        total_reports: block._count.reports,
        created_at: block.created_at,
        updated_at: block.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get block by block number
   * @param {number} blockNumber - Block number (1-100)
   * @returns {Promise<object>} Block data
   */
  async getBlockByNumber(blockNumber) {
    try {
      const block = await prisma.block.findUnique({
        where: { block_number: parseInt(blockNumber) },
        include: {
          coordinator_assignments: {
            include: {
              coordinator: {
                select: {
                  id: true,
                  full_name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!block) {
        throw new Error('Block not found');
      }

      return {
        id: block.id,
        block_number: block.block_number,
        name: block.name,
        description: block.description,
        coordinators: block.coordinator_assignments.map(assignment => assignment.coordinator),
        created_at: block.created_at,
        updated_at: block.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new block
   * @param {object} blockData - Block data
   * @returns {Promise<object>} Created block
   */
  async createBlock(blockData) {
    try {
      const { block_number, name, description } = blockData;

      // Validate block number range
      if (block_number < 1 || block_number > 200) {
        throw new Error('Block number must be between 1 and 200');
      }

      // Check if block number already exists
      const existingBlock = await prisma.block.findUnique({
        where: { block_number: parseInt(block_number) }
      });

      if (existingBlock) {
        throw new Error('Block number already exists');
      }

      const block = await prisma.block.create({
        data: {
          block_number: parseInt(block_number),
          name,
          description
        }
      });

      return block;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update block
   * @param {number} blockId - Block ID
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Updated block
   */
  async updateBlock(blockId, updateData) {
    try {
      const { name, description } = updateData;

      const block = await prisma.block.update({
        where: { id: parseInt(blockId) },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          updated_at: new Date()
        }
      });

      return block;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Block not found');
      }
      throw error;
    }
  }

  /**
   * Delete block (only if no reports exist)
   * @param {number} blockId - Block ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteBlock(blockId) {
    try {
      // Check if block has any reports
      const reportCount = await prisma.report.count({
        where: { block_id: parseInt(blockId) }
      });

      if (reportCount > 0) {
        throw new Error('Cannot delete block with existing reports');
      }

      // Delete coordinator assignments first
      await prisma.coordinatorAssignment.deleteMany({
        where: { block_id: parseInt(blockId) }
      });

      // Delete the block
      await prisma.block.delete({
        where: { id: parseInt(blockId) }
      });

      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Block not found');
      }
      throw error;
    }
  }

  /**
   * Assign coordinator to block
   * @param {number} blockId - Block ID (null for "Location Not Specified")
   * @param {string} coordinatorId - Coordinator user ID
   * @returns {Promise<object>} Assignment data
   */
  async assignCoordinator(blockId, coordinatorId) {
    try {
      // Verify coordinator exists and has coordinator role
      const coordinator = await prisma.user.findUnique({
        where: { id: coordinatorId },
        select: { id: true, role: true, full_name: true, email: true }
      });

      if (!coordinator) {
        throw new Error('Coordinator not found');
      }

      if (coordinator.role !== 'coordinator') {
        throw new Error('User is not a coordinator');
      }

      // If blockId is provided, verify block exists
      if (blockId !== null) {
        const block = await prisma.block.findUnique({
          where: { id: parseInt(blockId) }
        });

        if (!block) {
          throw new Error('Block not found');
        }
      }

      // Check if assignment already exists - handle null block_id properly
      const whereClause = {
        coordinator_id: coordinatorId,
        block_id: blockId ? parseInt(blockId) : null
      };

      const existingAssignment = await prisma.coordinatorAssignment.findFirst({
        where: whereClause
      });

      if (existingAssignment) {
        throw new Error('Coordinator already assigned to this block');
      }

      const assignment = await prisma.coordinatorAssignment.create({
        data: {
          coordinator_id: coordinatorId,
          block_id: blockId ? parseInt(blockId) : null
        },
        include: {
          coordinator: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          block: true
        }
      });

      return {
        id: assignment.id,
        coordinator: assignment.coordinator,
        block: assignment.block,
        assigned_at: assignment.assigned_at
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove coordinator assignment
   * @param {number} blockId - Block ID (null for "Location Not Specified")
   * @param {string} coordinatorId - Coordinator user ID
   * @returns {Promise<boolean>} Success status
   */
  async removeCoordinatorAssignment(blockId, coordinatorId) {
    try {
      const whereClause = {
        coordinator_id: coordinatorId,
        block_id: blockId ? parseInt(blockId) : null
      };

      const assignment = await prisma.coordinatorAssignment.findFirst({
        where: whereClause
      });

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      await prisma.coordinatorAssignment.delete({
        where: {
          id: assignment.id
        }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all coordinator assignments
   * @returns {Promise<object>} Assignment matrix
   */
  async getCoordinatorAssignments() {
    try {
      const assignments = await prisma.coordinatorAssignment.findMany({
        include: {
          coordinator: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          },
          block: true
        },
        orderBy: [
          { block_id: 'asc' },
          { coordinator: { full_name: 'asc' } }
        ]
      });

      // Group by coordinator
      const coordinatorMap = {};
      assignments.forEach(assignment => {
        const coordinatorId = assignment.coordinator.id;
        if (!coordinatorMap[coordinatorId]) {
          coordinatorMap[coordinatorId] = {
            coordinator: assignment.coordinator,
            assignments: []
          };
        }
        coordinatorMap[coordinatorId].assignments.push({
          id: assignment.id,
          block: assignment.block,
          assigned_at: assignment.assigned_at
        });
      });

      return {
        assignments: Object.values(coordinatorMap),
        total_coordinators: Object.keys(coordinatorMap).length,
        total_assignments: assignments.length
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get coordinators for a specific block
   * @param {number} blockId - Block ID (null for "Location Not Specified")
   * @returns {Promise<array>} List of coordinators
   */
  async getBlockCoordinators(blockId) {
    try {
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { block_id: blockId ? parseInt(blockId) : null },
        include: {
          coordinator: {
            select: {
              id: true,
              full_name: true,
              email: true
            }
          }
        }
      });

      return assignments.map(assignment => ({
        ...assignment.coordinator,
        assigned_at: assignment.assigned_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get blocks assigned to a coordinator
   * @param {string} coordinatorId - Coordinator user ID
   * @returns {Promise<array>} List of assigned blocks
   */
  async getCoordinatorBlocks(coordinatorId) {
    try {
      const assignments = await prisma.coordinatorAssignment.findMany({
        where: { coordinator_id: coordinatorId },
        include: {
          block: true
        }
      });

      return assignments.map(assignment => ({
        assignment_id: assignment.id,
        block: assignment.block,
        assigned_at: assignment.assigned_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize default blocks (1-100) if they don't exist
   * @returns {Promise<number>} Number of blocks created
   */
  async initializeDefaultBlocks() {
    try {
      const existingBlocks = await prisma.block.findMany({
        select: { block_number: true }
      });

      const existingNumbers = new Set(existingBlocks.map(block => block.block_number));
      const blocksToCreate = [];

      for (let i = 1; i <= 100; i++) {
        if (!existingNumbers.has(i)) {
          blocksToCreate.push({
            block_number: i,
            name: `Block ${i}`,
            description: `Campus Block ${i}`
          });
        }
      }

      if (blocksToCreate.length > 0) {
        await prisma.block.createMany({
          data: blocksToCreate
        });
      }

      return blocksToCreate.length;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BlockService();