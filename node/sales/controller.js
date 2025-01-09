const pool = require('../db');
const queries = require('./queries');

// Function to add a new sale
const addSales = async (req, res) => {
    const {
        amount, service_charge, gross_sales, product_name, category,
        quantity_sold, price_per_unit, mode_of_payment, order_type
    } = req.body;

    try {
        // Using the addSales query to insert a new sale into the database
        const addResult = await pool.query(queries.addSales, [
            amount, service_charge, gross_sales, product_name, category,
            quantity_sold, price_per_unit, mode_of_payment, order_type
        ]);

        // Return a success message
        res.status(201).json({
            message: 'Sales added successfully',
        });
    } catch (error) {
        console.error('Error adding sales:', error.message);
        res.status(500).json({ error: `Error adding sales: ${error.message}` });
    }
};

// Get sales data
const getSales = (req, res) => {
    pool.query(queries.getSales, (error, results) => {
        if (error) {
            console.error('Error fetching Sales:', error);
            return res.status(500).json({
                error: 'Error fetching Sales',
                details: error.message
            });
        }

        if (!results.rows) {
            return res.status(500).json({ error: 'Unexpected query result format' });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ message: 'No sales data found' });
        }

        res.status(200).json(results.rows);
    });
};



const getBestProducts = (req, res) => {
    pool.query(queries.getBestProducts, (error, results) => {
        if (error) {
            console.error('Error fetching Sales:', error);
            return res.status(500).json({ error: 'Error fetching Sales' });
        }
        res.status(200).json(results.rows);  // Return the products from the query
    });
};

module.exports = {
    addSales,
    getSales,
    getBestProducts,
};
