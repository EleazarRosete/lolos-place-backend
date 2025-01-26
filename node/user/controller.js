const pool = require('../db');
const queries = require('./queries');
const bcrypt = require('bcryptjs');


// Function to add a new sale
const updateUser = async (req, res) => {
    const { address, email, first_name, last_name, password, phone, user_id } = req.body;

    // Validate the data (this can be improved further)
    if (!address || !email || !first_name || !last_name || !phone || !user_id) {
        return res.status(400).json({ message: "All fields except password are required." });
    }

    try {
        // If a new password is provided, hash it
        let hashedPassword = undefined;
        if (password) {
            hashedPassword = bcrypt.hashSync(password, 10);
        }

        const values = [address, email, first_name, last_name, hashedPassword, phone, user_id];

        // If password is not provided, exclude it from the query values
        const query = hashedPassword 
            ? queries.updateUserWithPassword 
            : queries.updateUserWithoutPassword;
        
        // Update user info, depending on whether the password is provided or not
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        // Send the updated user data as response
        res.json({
            message: "User updated successfully.",
            user: rows[0],
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const updatePassword = async (req, res) => {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!userId || !oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New password and confirm password do not match." });
    }

    try {
        // Fetch user data from the database
        const result = await pool.query('SELECT password FROM users WHERE user_id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the old password matches the current password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Old password is incorrect." });
        }

        // Hash the new password before saving it
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);

        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({ message: "An error occurred while updating the password." });
    }
};


// Get sales data
const getUser = (req, res) => {
    const { id } = req.query;  // Assuming user ID is passed as a query parameter (e.g., ?id=14)

    // Validate if the id is provided and is a valid number
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid or missing user ID' });
    }
    
    pool.query(queries.getUser, [id], (error, results) => {
        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).json({
                error: 'Error fetching user data',
                details: error.message
            });
        }

        if (!results.rows || results.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(results.rows[0]);  // Send the first row as the user data
    });
};



module.exports = {
    getUser,
    updateUser,
    updatePassword,
};
