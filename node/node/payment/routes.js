const { Router } = require('express');
const controller = require('./controller');
const { addPayment } = require('./queries');

const router = Router();

router.get('/get-payment', controller.getPayment);
router.post('/create-gcash-checkout-session', controller.addPayment)


module.exports = router;
