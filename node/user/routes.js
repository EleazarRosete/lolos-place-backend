const { Router } = require('express');
const controller = require('./controller');

const router = Router();

router.get('/get-user', controller.getUser);
router.put('/update-user', controller.updateUser);
router.put('/update-password', controller.updatePassword);



module.exports = router;
