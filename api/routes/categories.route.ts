import express from 'express';

import { getCategory, listCategories } from '../controllers/categories.controller';

const router = express.Router();

router.get('/', listCategories);
router.get('/:id', getCategory);

export default router;
