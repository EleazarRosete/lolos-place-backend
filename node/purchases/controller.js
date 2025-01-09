const pool = require('../db');
const queries = require('./queries');
const axios = require('axios'); // Import axios

const getPurchases = async (req, res) => {
    try {
        // Query the database using the 'getPurchases' query
        const { rows } = await pool.query(queries.getPurchases);

        // If no purchases are found, return a 404 status
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No purchases found' });
        }

        // Return the fetched data with a 200 status
        res.status(200).json(rows);
    } catch (error) {
        // Log the error for debugging
        console.error('Error fetching purchases:', error);

        // Return a 500 status for server errors
        res.status(500).json({ error: 'Error fetching purchases' });
    }
};



const addPurchases = async (req, res) => {
    const { ordertype, amount, orders, name } = req.body;

    // Validate incoming data
    if (!ordertype || !amount || !orders || !name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Execute the query with the provided data
        const result = await pool.query(queries.addPurchases, [ordertype, amount, orders, name]);

        // If the insert was successful, return a success message
        res.status(201).json({ message: 'Purchase added successfully', data: result.rows[0] });
    } catch (error) {
        // Log and return error if query fails
        console.error('Error adding purchase:', error);
        res.status(500).json({ error: 'Error adding purchase' });
    }
};

module.exports = {
    getPurchases,
    addPurchases,
};
