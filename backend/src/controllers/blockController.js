const blockService = require('../services/blockService');
const { successResponse, errorResponse, notFoundResponse, validationErrorResponse } = require('../utils/response');

class BlockController {
  /**
   * Get all blocks
   * GET /admin/blocks
   */
  async getAllBlocks(req, res) {
    try {
      const filters = req.query;
      const result = await blockService.getAllBlocks(filters);

      res.status(200).json(successResponse(
        'Blocks retrieved successfully',
        result
      ));
    } catch (error) {
      console.error('Get all blocks error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve blocks',
        'BLOCK_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Get block by ID
   * GET /admin/blocks/:id
   */
  async getBlockById(req, res) {
    try {
      const { id } = req.params;
      const block = await blockService.getBlockById(id);

      res.status(200).json(successResponse(
        'Block retrieved successfully',
        block
      ));
    } catch (error) {
      console.error('Get block error:', error);

      if (error.message === 'Block not found') {
        return res.status(404).json(notFoundResponse('Block'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve block',
        'BLOCK_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Get block by block number
   * GET /blocks/:number
   */
  async getBlockByNumber(req, res) {
    try {
      const { number } = req.params;
      const blockNumber = parseInt(number);

      if (isNaN(blockNumber) || blockNumber < 1 || blockNumber > 100) {
        return res.status(400).json(validationErrorResponse(
          'Block number must be between 1 and 100'
        ));
      }

      const block = await blockService.getBlockByNumber(blockNumber);

      res.status(200).json(successResponse(
        'Block retrieved successfully',
        block
      ));
    } catch (error) {
      console.error('Get block by number error:', error);

      if (error.message === 'Block not found') {
        return res.status(404).json(notFoundResponse('Block'));
      }

      res.status(500).json(errorResponse(
        'Failed to retrieve block',
        'BLOCK_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Create new block
   * POST /admin/blocks
   */
  async createBlock(req, res) {
    try {
      const blockData = req.body;
      const block = await blockService.createBlock(blockData);

      res.status(201).json(successResponse(
        'Block created successfully',
        block
      ));
    } catch (error) {
      console.error('Create block error:', error);

      if (error.message === 'Block number must be between 1 and 100') {
        return res.status(400).json(validationErrorResponse(
          'Block number must be between 1 and 100'
        ));
      }

      if (error.message === 'Block number already exists') {
        return res.status(409).json(errorResponse(
          'Block number already exists',
          'BLOCK_ALREADY_EXISTS'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to create block',
        'BLOCK_CREATION_ERROR'
      ));
    }
  }

  /**
   * Update block
   * PUT /admin/blocks/:id
   */
  async updateBlock(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const block = await blockService.updateBlock(id, updateData);

      res.status(200).json(successResponse(
        'Block updated successfully',
        block
      ));
    } catch (error) {
      console.error('Update block error:', error);

      if (error.message === 'Block not found') {
        return res.status(404).json(notFoundResponse('Block'));
      }

      res.status(500).json(errorResponse(
        'Failed to update block',
        'BLOCK_UPDATE_ERROR'
      ));
    }
  }

  /**
   * Delete block
   * DELETE /admin/blocks/:id
   */
  async deleteBlock(req, res) {
    try {
      const { id } = req.params;
      await blockService.deleteBlock(id);

      res.status(200).json(successResponse(
        'Block deleted successfully',
        null
      ));
    } catch (error) {
      console.error('Delete block error:', error);

      if (error.message === 'Block not found') {
        return res.status(404).json(notFoundResponse('Block'));
      }

      if (error.message === 'Cannot delete block with existing reports') {
        return res.status(409).json(errorResponse(
          'Cannot delete block with existing reports',
          'BLOCK_HAS_REPORTS'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to delete block',
        'BLOCK_DELETION_ERROR'
      ));
    }
  }

  /**
   * Assign coordinator to block
   * POST /admin/blocks/:id/coordinators
   */
  async assignCoordinator(req, res) {
    try {
      const { id } = req.params;
      const { coordinator_id } = req.body;

      if (!coordinator_id) {
        return res.status(400).json(validationErrorResponse(
          'Coordinator ID is required'
        ));
      }

      // Handle "Location Not Specified" assignment
      const blockId = id === 'general' ? null : id;

      const assignment = await blockService.assignCoordinator(blockId, coordinator_id);

      res.status(201).json(successResponse(
        'Coordinator assigned successfully',
        assignment
      ));
    } catch (error) {
      console.error('Assign coordinator error:', error);

      if (error.message === 'Block not found') {
        return res.status(404).json(notFoundResponse('Block'));
      }

      if (error.message === 'Coordinator not found') {
        return res.status(404).json(notFoundResponse('Coordinator'));
      }

      if (error.message === 'User is not a coordinator') {
        return res.status(400).json(validationErrorResponse(
          'User is not a coordinator'
        ));
      }

      if (error.message === 'Coordinator already assigned to this block') {
        return res.status(409).json(errorResponse(
          'Coordinator already assigned to this block',
          'COORDINATOR_ALREADY_ASSIGNED'
        ));
      }

      res.status(500).json(errorResponse(
        'Failed to assign coordinator',
        'COORDINATOR_ASSIGNMENT_ERROR'
      ));
    }
  }

  /**
   * Remove coordinator assignment
   * DELETE /admin/blocks/:id/coordinators/:coordinatorId
   */
  async removeCoordinatorAssignment(req, res) {
    try {
      const { id, coordinatorId } = req.params;

      // Handle "Location Not Specified" assignment
      const blockId = id === 'general' ? null : id;

      await blockService.removeCoordinatorAssignment(blockId, coordinatorId);

      res.status(200).json(successResponse(
        'Coordinator assignment removed successfully',
        null
      ));
    } catch (error) {
      console.error('Remove coordinator assignment error:', error);

      if (error.message === 'Assignment not found') {
        return res.status(404).json(notFoundResponse('Assignment'));
      }

      res.status(500).json(errorResponse(
        'Failed to remove coordinator assignment',
        'COORDINATOR_REMOVAL_ERROR'
      ));
    }
  }

  /**
   * Get coordinator assignments matrix
   * GET /admin/assignments
   */
  async getCoordinatorAssignments(req, res) {
    try {
      const result = await blockService.getCoordinatorAssignments();

      res.status(200).json(successResponse(
        'Coordinator assignments retrieved successfully',
        result
      ));
    } catch (error) {
      console.error('Get coordinator assignments error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve coordinator assignments',
        'ASSIGNMENT_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Get coordinators for a specific block
   * GET /blocks/:id/coordinators
   */
  async getBlockCoordinators(req, res) {
    try {
      const { id } = req.params;
      
      // Handle "Location Not Specified" coordinators
      const blockId = id === 'general' ? null : id;

      const coordinators = await blockService.getBlockCoordinators(blockId);

      res.status(200).json(successResponse(
        'Block coordinators retrieved successfully',
        { coordinators }
      ));
    } catch (error) {
      console.error('Get block coordinators error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve block coordinators',
        'COORDINATOR_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Get blocks assigned to a coordinator
   * GET /coordinators/:id/blocks
   */
  async getCoordinatorBlocks(req, res) {
    try {
      const { id } = req.params;
      const blocks = await blockService.getCoordinatorBlocks(id);

      res.status(200).json(successResponse(
        'Coordinator blocks retrieved successfully',
        { blocks }
      ));
    } catch (error) {
      console.error('Get coordinator blocks error:', error);
      res.status(500).json(errorResponse(
        'Failed to retrieve coordinator blocks',
        'BLOCK_RETRIEVAL_ERROR'
      ));
    }
  }

  /**
   * Initialize default blocks (1-100)
   * POST /admin/blocks/initialize
   */
  async initializeDefaultBlocks(req, res) {
    try {
      const createdCount = await blockService.initializeDefaultBlocks();

      res.status(200).json(successResponse(
        `Initialized ${createdCount} default blocks`,
        { blocks_created: createdCount }
      ));
    } catch (error) {
      console.error('Initialize blocks error:', error);
      res.status(500).json(errorResponse(
        'Failed to initialize default blocks',
        'BLOCK_INITIALIZATION_ERROR'
      ));
    }
  }
}

module.exports = new BlockController();