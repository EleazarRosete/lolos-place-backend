const { Router } = require('express');
const controller = require('./controller');
const { addPayment } = require('./queries');

const router = Router();

router.get('/get-purchases', controller.getPurchases);
router.post('/add-purchases', controller.addPurchases)


module.exports = router;
