const { Router } = require('express');
const controller = require('./controller');

const router = Router();

router.post('/add-sales', controller.addSales);
router.get('/get-sales', controller.getSales);

router.get('/get-top-products', controller.getBestProducts);


module.exports = router;
