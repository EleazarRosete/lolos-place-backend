const addComment = "INSERT INTO feedback (name, comment, date) VALUES ($1, $2, $3)";
const getComments = "SELECT * FROM feedback";


module.exports = {
    addComment,
    getComments,
};