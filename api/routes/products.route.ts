import express from 'express';

import { getProduct, listProducts } from '../controllers/products.controller';

const router = express.Router();

router.get('/:idOrSlug', getProduct);
router.get('/', listProducts);

export default router;
