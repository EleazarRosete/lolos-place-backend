const { Router } = require('express');
const controller = require('./controller');

const router = Router();



router.post('/add-order-temp-data', controller.addTempData);
router.get('/get-order-temp-data', controller.getTempData);
router.patch('/update-order-temp-data/:menu_id', controller.updateTempData);
router.patch('/minus-order-temp-data/:menu_id', controller.minusTempData);
router.delete('/delete-order-temp-data', controller.deleteTempData);
router.delete('/delete-order-temp-data-by/:menu_id', controller.deleteTempDataByID);



module.exports = router;
