const addProduct = `INSERT INTO order_temp_storage_ ( menu_id, name, price, quantity, stocks, total ) VALUES ($1,$2, $3,$4, $5, $6) RETURNING order_temp_storage_id;`;
const getProduct = "SELECT * FROM order_temp_storage_;";
const updateProduct = `UPDATE order_temp_storage_ SET quantity = $1 WHERE menu_id = $2;`;
const minusTempData = `UPDATE order_temp_storage_ SET quantity = quantity - 1 WHERE menu_id = $1;`;
const deleteProduct = "TRUNCATE TABLE order_temp_storage_ RESTART IDENTITY;"; 
const deleteProductByID = `DELETE FROM order_temp_storage_ WHERE menu_id = $1;`;



module.exports = {
    addProduct,
    getProduct,
    updateProduct,
    minusTempData,
    deleteProduct,
    deleteProductByID,
};
