const pool = require('../db');
const queries = require('./queries');

const addComment = (req, res) => {
    const { username, comment, feedback_date } = req.body;

    pool.query(queries.addComment, [username, comment, feedback_date], (error, results) => {
        if (error) {
            console.error('Error adding comment:', error);
            return res.status(500).json({ error: 'Error adding comment' });
        }
        res.status(200).json({ message: "Added successfully" }); // Send success message
    });
};


const getComment = (req, res) => {
    pool.query(queries.getComments, (error, results) => {
        if (error) {
            console.error('Error fetching comments:', error);
            return res.status(500).json({ error: 'Error fetching comments' });
        }
        res.status(200).json(results.rows); // Ensure you return the rows
    });
};

module.exports = {
    addComment,
    getComment,
};
