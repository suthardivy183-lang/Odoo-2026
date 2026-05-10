import { Router } from 'express';
import { register, login, me, updateProfileController, changePasswordController, deleteAccountController, forgotPasswordController, resetPasswordController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register',         register);
router.post('/login',            login);
router.get('/me',                authMiddleware, me);
router.put('/me',                authMiddleware, updateProfileController);
router.put('/me/password',       authMiddleware, changePasswordController);
router.delete('/me',             authMiddleware, deleteAccountController);
router.post('/forgot-password',  forgotPasswordController);
router.post('/reset-password',   resetPasswordController);

export default router;
