const { Router } = require('express');
const controller = require('./controller');

const router = Router();


router.post('/add-order', controller.addOrder);
router.get('/get-order', controller.getOrder);
router.get('/get-order-quantities', controller.getOrderQuantities);

router.delete('/delete-order/:order_id', controller.deleteOrder);
router.put('/update-is-paid/:order_id', controller.updateIsPaid);
router.put('/order-served/:order_id', controller.orderServed);
router.put('/update-not-paid/:order_id', controller.updateNotPaid);






router.post('/add-temp-data', controller.addTempData);
router.get('/get-temp-data', controller.getTempData);
router.delete('/delete-temp-data', controller.deleteTempData);

router.post('/add-reservation', controller.addReservation);
router.put('/accepted-reservation', controller.accepted);
router.put('/canceled-reservation', controller.canceled);

router.get('/get-reservation', controller.getReservation);
router.delete('/cancel-reservation/:reservation_id', controller.cancelReservation);

router.post('/add-delivery', controller.addDelivery);
router.get('/get-delivery', controller.getDelivery);
router.put('/update-delivery/:delivery_id', controller.updateDeliveryStatus);


router.get('/get-payment', controller.getPayment);

router.get('/get-users', controller.getUsers);


module.exports = router;
