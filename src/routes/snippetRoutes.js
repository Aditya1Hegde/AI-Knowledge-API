import express from 'express';
import SnippetController from '../controllers/snippetController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', SnippetController.create);
router.get('/', SnippetController.getMySnippets);
router.get('/:id', SnippetController.getSnippet);
router.put('/:id', SnippetController.update);
router.delete('/:id', SnippetController.delete);

// Semantic search
router.post('/search', SnippetController.search);

export default router;
