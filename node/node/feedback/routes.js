const {Router} =  require('express');
const controller = require('./controller');

const router  = Router();


router.post('/add-comment' , controller.addComment);
router.get('/get-comment' , controller.getComment);
    
module.exports = router;