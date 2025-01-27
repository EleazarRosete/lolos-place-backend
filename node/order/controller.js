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
            product_stock
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



const addOrder = async (req, res) => {
    const { mop, total_amount, delivery, reservation_id, order_type, items, customer_name, number_of_people, ispaid } = req.body;
    const sum = parseInt(total_amount, 10); // Parse total_amount to integer

    try {
        // Using the addOrder query to insert the new order into the database
        const addResult = await pool.query(queries.addOrder, [
            mop,
            sum,
            delivery,
            reservation_id,
            order_type,
            customer_name,
            number_of_people,
            ispaid,
        ]);

        // Insert items after order is successfully created
        for (let item of items) {
            const orderQuantityQuery = `
          INSERT INTO order_quantities (order_id, menu_id, order_quantity)
          VALUES ($1, $2, $3);
        `;
            await pool.query(orderQuantityQuery, [addResult.rows[0].order_id, item.menu_id, item.quantity]);
        }

        // Return the order_id of the newly inserted order after all operations
        res.status(201).json({
            message: 'Order added successfully',
            orderId: addResult.rows[0].order_id, // Returning the order_id
        });

    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ error: 'Error adding order' });
    }
};



const getOrder = (req, res) => {
    pool.query(queries.getOrder, (error, results) => {
        if (error) {
            console.error('Error fetching Product:', error);
            return res.status(500).json({ error: 'Error fetching Product' });
        }
        res.status(200).json(results.rows);
    });
};

const addReservation = async (req, res) => {
    const { guest_number, reservation_date, reservation_time, advance_order } = req.body;

    try {
        // Using the addReservation query to insert the new reservation into the database
        const addResult = await pool.query(queries.addReservation, [
            guest_number,
            reservation_date,
            reservation_time,
            advance_order,
        ]);

        // Return the reservation_id of the newly inserted reservation
        res.status(201).json({
            message: 'Reservation added successfully',
            reservationId: addResult.rows[0].reservation_id, // Returning the reservation_id
        });
    } catch (error) {
        console.error('Error adding reservation:', error);
        res.status(500).json({ error: 'Error adding reservation' });
    }
};

const getReservation = (req, res) => {
    pool.query(queries.getReservation, (error, results) => {
        if (error) {
            console.error('Error fetching reservations:', error);
            return res.status(500).json({ error: 'Error fetching reservations' });
        }
        res.status(200).json(results.rows);
    });
};

// Function to add a new delivery
const addDelivery = async (req, res) => {
    const { order_id, delivery_location, delivery_status } = req.body;

    try {
        // Using the addDelivery query to insert a new delivery into the database
        const addResult = await pool.query(queries.addDelivery, [
            order_id,
            delivery_location,
            delivery_status,
        ]);

        // Return the delivery_id of the newly inserted delivery
        res.status(201).json({
            message: 'Delivery added successfully',
            deliveryId: addResult.rows[0].delivery_id, // Returning the delivery_id
        });
    } catch (error) {
        console.error('Error adding delivery:', error.message); // Log detailed error message
        res.status(500).json({ error: `Error adding delivery: ${error.message}` });
    }
};

const cancelReservation = async (req, res) => {
    const { reservation_id } = req.params;

    try {
        // Attempt to delete the reservation
        const result = await pool.query('DELETE FROM reservations WHERE reservation_id = $1 RETURNING *', [reservation_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        res.status(200).send('Reservation canceled successfully');
    } catch (err) {
        console.error('Error during DELETE operation:', err); // Log the full error
        res.status(500).json({ error: 'Error deleting reservation', details: err.message });
    }
};





// Function to get all deliveries
const getDelivery = (req, res) => {
    pool.query(queries.getDelivery, (error, results) => {
        if (error) {
            console.error('Error fetching deliveries:', error);
            return res.status(500).json({ error: 'Error fetching deliveries' });
        }
        res.status(200).json(results.rows);
    });
};

const getPayment = (req, res) => {
    pool.query(queries.getPayment, (error, results) => {
        if (error) {
            console.error('Error fetching Product:', error);
            return res.status(500).json({ error: 'Error fetching Product' });
        }
        res.status(200).json(results.rows);
    });
};

const updateDeliveryStatus = (req, res) => {
    const { delivery_id } = req.params; // Extract the delivery_id from the URL parameters

    pool.query(queries.updateDeliveryStatus, [delivery_id], (error, results) => {
        if (error) {
            console.error('Error updating delivery status:', error);
            return res.status(500).json({ error: 'Failed to update delivery status' });
        }

        if (results.rowCount === 0) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        res.status(200).json({
            message: 'Delivery status updated successfully',
            updatedDelivery: results.rows[0], // The updated delivery record
        });
    });
};



const getUsers = (req, res) => {
    pool.query(queries.getUsers, (error, results) => {
        if (error) {
            console.error('Error fetching Product:', error);
            return res.status(500).json({ error: 'Error fetching Product' });
        }
        res.status(200).json(results.rows);
    });
};

const orderServed = (req, res) => {
    const { order_id } = req.params; // Extract order_id from URL parameter

    pool.query(queries.orderServed, [order_id], (error, results) => {
        if (error) {
            console.error('Error updating order status:', error);
            return res.status(500).json({ error: 'Failed to update order status' });
        }

        if (results.rowCount === 0) {
            return res.status(404).json({ message: 'Order ID not found' });
        }

        res.status(200).json({
            message: 'Order status updated successfully',
            updatedOrder: results.rows[0], // The updated order record
        });
    });
};


const addTempData = async (req, res) => {
    const { order, salesdata, paidorder } = req.body;

    try {
        const addResult = await pool.query(
            `INSERT INTO temp_data ("order", salesdata, paidorder) 
            VALUES ($1, $2, $3) 
            RETURNING *`,
            [order, salesdata, paidorder]
        );

        res.status(201).json({
            message: 'Temporary data added successfully',
            tempDataId: addResult.rows[0].purchases_id
        });
    } catch (error) {
        console.error('Error adding temporary data:', error);
        res.status(500).json({ error: 'Error adding temporary data' });
    }
};


const getTempData = (req, res) => {
    pool.query(queries.getTempData, (error, results) => {
        if (error) {
            console.error('Error fetching Product:', error);
            return res.status(500).json({ error: 'Error fetching Product' });
        }
        res.status(200).json(results.rows);
    });
};

const deleteTempData = async (req, res) => {
    const { purchases_id } = req.params;

    try {
        // Attempt to delete the reservation
        const result = await pool.query('DELETE FROM temp_data WHERE purchases_id = $1 RETURNING *', [purchases_id]);

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Temporary Data not found' });
        }

        // Successful deletion
        res.status(200).json({ success: 'Success' });
    } catch (err) {
        // Log the full error for debugging
        console.error('Error during DELETE operation:', err);

        // Return a 500 error with the error message and details
        res.status(500).json({ error: 'Error deleting temporary data', details: err.message });
    }
};

const updateIsPaid = async (req, res) => {
    const { order_id } = req.params;
    try {
      console.log(`Updating payment status for order ID: ${order_id}`);
      const response = await pool.query(queries.updateIsPaid, [order_id]);
  
      if (response.rowCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({ message: "Order payment status updated successfully" });
    } catch (err) {
      console.error(`Error updating order payment status for order ID ${order_id}: ${err.message}`);
      res.status(500).json({ message: `Error updating order payment status: ${err.message}` });
    }
  };
  

  const deleteOrder = async (req, res) => {
    try {
      const { order_id } = req.params;
      const result = await queries.deleteOrder(order_id);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "An error occurred", error: error.message });
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
    addOrder,
    getOrder,
    deleteOrder,
    addReservation,
    getReservation,
    addDelivery,
    getDelivery,
    getPayment,
    updateDeliveryStatus,
    cancelReservation,
    getUsers,
    orderServed,
    addTempData,
    getTempData,
    deleteTempData,
    updateIsPaid,
};
