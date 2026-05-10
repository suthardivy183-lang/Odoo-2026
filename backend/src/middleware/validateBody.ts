import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodType } from 'zod';

const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.issues,
        });
      }

      return next(err);
    }
  };
};

export default validateBody;
