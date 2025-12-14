import Document from '../models/Document.js';
import DocumentChunk from '../models/DocumentChunk.js';
// COMMENT OUT DocumentService - we'll skip processing
// import DocumentService from '../services/documentService.js';

class DocumentController {
  // Upload document WITHOUT processing
  static async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { originalname, mimetype, size, path } = req.file;
      const userId = req.user.id;

      // Create document record and mark as completed immediately
      const document = await Document.create({
        userId,
        title: originalname,
        fileType: mimetype,
        fileSize: size,
        originalFilename: originalname
      });

      // Update status to completed (skip processing for now)
      await Document.updateStatus(document.id, 'completed');

      // SKIP PROCESSING - just return success
      console.log(`✅ Document ${document.id} uploaded (processing skipped)`);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: { document }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get user's documents
  static async getMyDocuments(req, res) {
    try {
      const documents = await Document.findByUserId(req.user.id);
      return res.status(200).json({
        success: true,
        data: { documents }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get document details
  static async getDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);

      if (!document || document.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const chunks = await DocumentChunk.findByDocumentId(id);

      return res.status(200).json({
        success: true,
        data: { document, chunks }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete document
  static async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);

      if (!document || document.user_id !== req.user.id) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      await Document.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default DocumentController;
