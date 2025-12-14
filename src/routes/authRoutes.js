import express from 'express';
import AuthController from '../controllers/authController.js';
import { signupValidation, loginValidation, validate } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signupValidation, validate, AuthController.signup);
router.post('/login', loginValidation, validate, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.getMe);

export default router;
