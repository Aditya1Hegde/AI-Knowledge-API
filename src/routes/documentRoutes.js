import express from 'express';
import DocumentController from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../config/multer.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload document
router.post('/upload', upload.single('file'), DocumentController.upload);

// Get all user's documents
router.get('/', DocumentController.getMyDocuments);

// Get specific document with chunks
router.get('/:id', DocumentController.getDocument);

// Delete document
router.delete('/:id', DocumentController.deleteDocument);

export default router;
