import Snippet from '../models/Snippet.js';

class SnippetController {
  // Create new snippet
  static async create(req, res) {
    try {
      const { title, content, documentId, tags } = req.body;
      const userId = req.user.id;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      // Create snippet WITHOUT embeddings - using full-text search
      const snippet = await Snippet.create({
        userId,
        documentId: documentId || null,
        title,
        content,
        embedding: null,
        tags: tags || []
      });

      console.log(`✅ Snippet ${snippet.id} created with full-text search`);

      return res.status(201).json({
        success: true,
        message: 'Snippet created successfully',
        data: { snippet }
      });
    } catch (error) {
      console.error('Error creating snippet:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all user's snippets
  static async getMySnippets(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const snippets = await Snippet.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
      const total = await Snippet.count(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          snippets,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single snippet
  static async getSnippet(req, res) {
    try {
      const { id } = req.params;
      const snippet = await Snippet.findById(id);

      if (!snippet || snippet.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: { snippet }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update snippet
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content, tags } = req.body;
      const snippet = await Snippet.findById(id);

      if (!snippet || snippet.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      const updatedSnippet = await Snippet.update(id, { title, content, tags });

      return res.status(200).json({
        success: true,
        message: 'Snippet updated successfully',
        data: { snippet: updatedSnippet }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete snippet
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const snippet = await Snippet.findById(id);

      if (!snippet || snippet.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Snippet not found'
        });
      }

      await Snippet.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Snippet deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Full-text search
  static async search(req, res) {
    try {
      const { query, tags, limit = 10 } = req.body;

      if (!query && (!tags || tags.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Query or tags are required'
        });
      }

      console.log(`🔍 Searching for: "${query}"${tags ? ` with tags: [${tags}]` : ''}`);

      let results;

      // Choose search method
      if (query && tags && tags.length > 0) {
        // Combined search
        results = await Snippet.advancedSearch(query, tags, req.user.id, parseInt(limit));
      } else if (query) {
        // Text search only
        results = await Snippet.fullTextSearch(query, req.user.id, parseInt(limit));
      } else {
        // Tags only
        results = await Snippet.searchByTags(tags, req.user.id, parseInt(limit));
      }

      console.log(`✅ Found ${results.length} relevant snippets`);

      return res.status(200).json({
        success: true,
        data: {
          query: query || null,
          tags: tags || null,
          results,
          count: results.length
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default SnippetController;
