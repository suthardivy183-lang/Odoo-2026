import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { registerUser, loginUser, getMe, updateProfile, changePassword, deleteAccount, forgotPassword, resetPassword } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerUser(input);
    res.status(201).json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const updateProfileController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user  = await updateProfile(req.user!.id, input);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

export const changePasswordController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    await changePassword(req.user!.id, input);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteAccountController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await deleteAccount(req.user!.id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    const { token } = await forgotPassword(input);
    // In production this token would be emailed. For demo we return it directly.
    res.json({ success: true, data: { token, message: 'If that email is registered, a reset link has been generated.' } });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    await resetPassword(input);
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};
