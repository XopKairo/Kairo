import express from 'express';
import { authAdmin, refreshTokens } from '../controllers/authController.js';
import { validateRequest, schemas } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/admin/login', validateRequest(schemas.adminLogin), authAdmin);
router.post('/refresh', refreshTokens);

export default router;
