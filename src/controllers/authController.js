import User from '../models/User.js';
import JWTService from '../utils/jwt.js';

class AuthController {
  static async signup(req, res) {
    try {
      const { email, password, name } = req.body;
      const existingUser = await User.findByEmail(email);
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }

      const user = await User.create({ email, password, name });
      const accessToken = JWTService.generateAccessToken(user);
      const refreshToken = JWTService.generateRefreshToken(user);
      await JWTService.storeRefreshToken(user.id, refreshToken);

      return res.status(201).json({
        success: true,
        message: 'User registered',
        data: { user, accessToken, refreshToken }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findByEmail(email);
      
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isValid = await User.verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const accessToken = JWTService.generateAccessToken(user);
      const refreshToken = JWTService.generateRefreshToken(user);
      await JWTService.storeRefreshToken(user.id, refreshToken);

      return res.status(200).json({
        success: true,
        data: { user, accessToken, refreshToken }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await JWTService.removeRefreshToken(refreshToken);
      }
      return res.status(200).json({
        success: true,
        message: 'Logged out'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getMe(req, res) {
    return res.status(200).json({
      success: true,
      data: { user: req.user }
    });
  }
}

export default AuthController;
