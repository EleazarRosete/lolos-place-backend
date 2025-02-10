const addProduct = `INSERT INTO order_temp_storage_ (order_data) VALUES ($1) RETURNING order_temp_storage_id;`;
const getProduct = "SELECT * FROM order_temp_storage_;";
const updateProduct = `UPDATE order_temp_storage_ SET order_data = $1::jsonb WHERE order_temp_storage_id = $2;`;

const deleteProduct = "DELETE FROM order_temp_storage_ WHERE order_temp_storage_id = $1;"; 


module.exports = {
    addProduct,
    getProduct,
    updateProduct,
    deleteProduct,
};
