const pool = require('../db');
const queries = require('./queries');




const addTempData = async (req, res) => {
    const { menu_id,name,price,quantity,stocks, total } = req.body;

    try {
        const addResult = await pool.query(queries.addProduct, [ menu_id,name,price,quantity,stocks, total ]);
        res.status(201).json({ 
            message: 'Order data added successfully', 
            productId: addResult.rows[0].order_temp_storage_id 
        });
    } catch (error) {
        console.error('Error adding order data:', error);
        res.status(500).json({ error: 'Error adding order data' });
    }
};

const getTempData = async (req, res) => {
    try {
        const results = await pool.query(queries.getProduct);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Error fetching product' });
    }
};

const updateTempData = async (req, res) => {
    const { quantity } = req.body;
    const { menu_id } = req.params; // Get ID from URL params

    if (!menu_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await pool.query(queries.updateProduct, [quantity, menu_id]);

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
};








const minusTempData = async (req, res) => {
    const productId = parseInt(req.params.menu_id); 

    try {

        await pool.query(queries.minusTempData, [ productId]); // Ensure query expects (quantity, productId)

        res.status(200).json({ message: 'Product stock updated successfully.' });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error updating product stock' });
    }
};

















const deleteTempData = async (req, res) => {

    try {
        await pool.query(queries.deleteProduct);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
};




const deleteTempDataByID = async (req, res) => {
    const productId = parseInt(req.params.menu_id); 

    if (!productId) {
        return res.status(400).json({ error: 'Missing order_temp_storage_id' });
    }

    try {
        await pool.query(queries.deleteProductByID, [productId]);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error deleting product' });
    }
};


module.exports = {
    addTempData,
    getTempData,
    updateTempData,
    minusTempData,
    deleteTempData,
    deleteTempDataByID,
};
