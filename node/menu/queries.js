const addProduct = `INSERT INTO menu_items (name, description, category, price, items,img, stocks) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING menu_id;`;
const getProduct = "SELECT * FROM menu_items;";
const getProductById = "SELECT * FROM menu_items WHERE menu_id = $1";
const updateProduct = "UPDATE menu_items SET name = $1, description = $2, category = $3, price = $4, items = $5, img = $6, stocks = $7 WHERE menu_id = $8;";
const deleteProduct = "DELETE FROM menu_items WHERE menu_id = $1;"; 
const getCategories = 'SELECT category FROM menu_items';
const getStock = 'SELECT stocks FROM menu_items WHERE menu_id = $1';
const updateStock = `UPDATE menu_items SET stocks = stocks - $1 WHERE menu_id = $2`;
const getLowStocks = 'SELECT * FROM menu_items WHERE stocks < 21';


module.exports = {
    addProduct,
    getProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getCategories,
    getStock,
    updateStock,
    getLowStocks,
};
