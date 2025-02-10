const { Router } = require('express');
const controller = require('./controller');

const router = Router();

router.post('/add-product', controller.addProduct);
router.get('/get-product', controller.getProduct);
router.get('/get-product/:menu_id', controller.getProductById);
router.put('/edit-product/:menu_id', controller.updateProduct);
router.delete('/delete-product/:menu_id', controller.deleteProduct);
router.patch('/update-product-stock/:menu_id', controller.updateProductStock);
router.get('/get-categories',controller.getCategories);
router.get('/get-low-stocks',controller.getLowStocks);


router.patch('/add-product-stock-by-one/:menu_id', controller.addProductStockByOne);
router.patch('/minus-product-stock-by-one/:menu_id', controller.minusProductStockByOne);
router.patch('/remove-order/:menu_id', controller.removeOrder);


module.exports = router;
