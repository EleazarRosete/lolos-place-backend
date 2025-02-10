const pool = require('../db');
const queries = require('./queries');


const addProduct = async (req, res) => {
    const { name, description, category, price, items, img, stocks } = req.body;

    const product_price = parseInt(price, 10);
    const product_stock = parseInt(stocks, 10);

    try {
        const addResult = await pool.query(queries.addProduct, [
            name,
            description,
            category,
            product_price,
            items,
            img,
            product_stock,
        ]);

        res.status(201).json({ message: 'Product item added successfully', productId: addResult.rows[0].menu_id });
    } catch (error) {
        console.error('Error adding product item:', error);
        res.status(500).json({ error: 'Error adding product item' });
    }
};






const getProduct = (req, res) => {
    pool.query(queries.getProduct, (error, results) => {
        if (error) {
            console.error('Error fetching Product:', error);
            return res.status(500).json({ error: 'Error fetching Product' });
        }
        res.status(200).json(results.rows);
    });
};

const getProductById = (req, res) => {
    const menu_id = parseInt(req.params.menu_id); // Correctly parse the menu_id

    pool.query(queries.getProductById, [menu_id], (error, results) => {
        if (error) {
            console.error('Error fetching Product by menu_id:', error);
            return res.status(500).json({ error: 'Error fetching Product by menu_id' });
        }
        if (results.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json(results.rows[0]);
    });
};

const updateProduct = (req, res) => {
    // const menu_id = parseInt(req.params.menu_id); // Correctly parse the menu_id
    const { menu_id, name, description, category, price, items, img, stocks } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Product name is required and cannot be null' });
    }

    // Fetch the product by ID first
    pool.query(queries.getProductById, [menu_id], (error, results) => {
        if (error) {
            console.error('Error fetching product:', error);
            return res.status(500).json({ error: 'Error fetching product' });
        }
        // If no product found
        if (results.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update the product
        pool.query(queries.updateProduct, [
            name,
            description || null,
            category || null,
            price || null,
            items || null,
            img || null,
            stocks || null,
            menu_id // Use menu_id instead of name
        ], (error) => {
            if (error) {
                console.error('Error updating product:', error);
                return res.status(500).json({ error: 'Error updating product' });
            }

            // Respond with success message
            return res.status(200).json({ message: 'Product updated successfully' });
        });
    });
};


const deleteProduct = (req, res) => {
    const { menu_id } = req.params; // Get the menu_id from the URL params

    pool.query(queries.getProductById, [menu_id], (error, results) => {
        if (error) {
            console.error('Error fetching product:', error);
            return res.status(500).json({ error: 'Error fetching product' });
        }

        if (results.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        pool.query(queries.deleteProduct, [menu_id], (error) => {
            if (error) {
                console.error('Error deleting product:', error);
                return res.status(500).json({ error: 'Error deleting product' });
            }
            return res.status(200).send("Product deleted successfully");
        });
    });
};

const updateProductStock = async (req, res) => {
    const productId = parseInt(req.params.menu_id); // Get the product ID from the URL parameters
    const { quantity } = req.body; // Get the stock from the request body

    if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity provided.' });
    }

    try {
        // Check the current product stock
        const currentProduct = await pool.query(queries.getStock, [productId]);

        if (currentProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const currentStock = currentProduct.rows[0].stocks;

        // Ensure we don't reduce below zero
        if (currentStock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update the product stock in the database
        await pool.query(queries.updateStock, [quantity, productId]);

        res.status(200).json({ message: 'Product stock updated successfully.' });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error updating product stock' });
    }
};


const getCategories = async (req, res) => {
    try {
        const categories = await pool.query(queries.getCategories);
        res.json(categories.rows.map(row => row.category));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

const getLowStocks = async (req, res) => {
    try {
        // Execute the query to fetch low stock items
        const result = await pool.query(queries.getLowStocks); // Make sure queries.getLowStocks is correct
        // Return the rows from the query result
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};







const addProductStockByOne = async (req, res) => {
    const productId = parseInt(req.params.menu_id);

    try {

        // Increase the product stock
        await pool.query(queries.addProductStockByOne, [productId]);

        res.status(200).json({ message: 'Product stock increased successfully.' });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error updating product stock' });
    }
};




const minusProductStockByOne = async (req, res) => {
    const productId = parseInt(req.params.menu_id); 

    try {

        await pool.query(queries.minusProductStockByOne, [ productId]); // Ensure query expects (quantity, productId)

        res.status(200).json({ message: 'Product stock updated successfully.' });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error updating product stock' });
    }
};



const removeOrder = async (req, res) => {
    const productId = parseInt(req.params.menu_id); // Get the product ID from the URL parameters
    const { quantity } = req.body; // Get the stock from the request body

    if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid quantity provided.' });
    }

    try {
        // Check the current product stock
        const currentProduct = await pool.query(queries.getStock, [productId]);

        if (currentProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const currentStock = currentProduct.rows[0].stocks;

        // Ensure we don't reduce below zero
        if (currentStock < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update the product stock in the database
        await pool.query(queries.removeOrder, [quantity, productId]);

        res.status(200).json({ message: 'Product stock updated successfully.' });
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error updating product stock' });
    }
};


module.exports = {
    addProduct,
    getProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    updateProductStock,
    getCategories,
    getLowStocks,
    addProductStockByOne,
    minusProductStockByOne,
    removeOrder,
};
