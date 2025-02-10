const pool = require('../db');
const queries = require('./queries');

const addTempData = async (req, res) => {
    const { order_data } = req.body;

    try {
        const addResult = await pool.query(queries.addProduct, [order_data]);
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
    const { order_data } = req.body;
    const { order_temp_storage_id } = req.params; // Get ID from URL params

    if (!order_data) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const orderDataJson = JSON.stringify(order_data); // Convert to JSON string
        await pool.query(queries.updateProduct, [orderDataJson, order_temp_storage_id]);

        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error updating product' });
    }
};


const deleteTempData = async (req, res) => {
    const { order_temp_storage_id } = req.params;

    if (!order_temp_storage_id) {
        return res.status(400).json({ error: 'Missing order_temp_storage_id' });
    }

    try {
        await pool.query(queries.deleteProduct, [order_temp_storage_id]);
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
    deleteTempData,
};
