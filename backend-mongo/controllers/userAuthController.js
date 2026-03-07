import authService from '../services/authService.js';

class UserAuthController {
  async sendOtp(req, res) {
    try {
      const { contact } = req.body;
      if (!contact) return res.status(400).json({ success: false, message: 'Contact info required' });
      const result = await authService.sendOtp(contact);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { contact, otp } = req.body;
      const result = await authService.verifyOtp(contact, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'BETA_ONLY') {
        return res.status(403).json({ 
          success: false, 
          message: 'Registration is currently limited to beta testers. Please contact support.' 
        });
      }
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
         return res.status(403).json({ success: false, message: 'OTP token invalid or expired' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { contact, password } = req.body;
      const result = await authService.login(contact, password);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ success: false, message: error.message });
      }
      if (error.message === 'Account is banned') {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const result = await authService.deleteAccount(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new UserAuthController();
