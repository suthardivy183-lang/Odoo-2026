import { Request, Response, NextFunction } from 'express';
import { searchCities, getCityById } from '../services/city.service';

export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, country, region } = req.query as Record<string, string>;
    const cities = await searchCities({ q, country, region });
    res.json({ success: true, data: { cities } });
  } catch (err) { next(err); }
};

export const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid city id' });
    }
    const city = await getCityById(id);
    res.json({ success: true, data: { city } });
  } catch (err) { next(err); }
};
