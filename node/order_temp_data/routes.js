const { Router } = require('express');
const controller = require('./controller');

const router = Router();

router.post('/add-order-temp-data', controller.addTempData);
router.get('/get-order-temp-data', controller.getTempData);
router.patch('/update-order-temp-data/:order_temp_storage_id', controller.updateTempData);
router.delete('/delete-order-temp-data/:order_temp_storage_id', controller.deleteTempData);


module.exports = router;
