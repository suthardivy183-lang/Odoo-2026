import { Router } from 'express';
import { list, getOne } from '../controllers/city.controller';

const router = Router();

router.get('/',    list);
router.get('/:id', getOne);

export default router;
