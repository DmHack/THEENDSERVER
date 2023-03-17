const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe, renewAccessToken, restPass, restPassEm, deleteAkk, deleteAkkEm, cod,
    allUsAdm, prTime, setNotif, setCurs, vupok, userCurs, compsSotr, addTimes, deleteAkkPers } = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// routes
router.post('/register', registerUser)
router.post('/login', loginUser)
router.get('/me', protect, getMe)
router.post('/updrefresh', renewAccessToken)
router.post('/sendRestPass', restPass)
router.post('/sendRestPassEm', restPassEm)
router.post('/deleteAkk', protect, deleteAkk)
router.post('/deleteAkkEm', protect, deleteAkkEm)
router.post('/cod', cod)
router.post('/allUsAdm', protect, allUsAdm)
router.post('/prTime', protect, prTime)
router.post('/setNotif', protect, setNotif)
router.post('/setCurs', protect, setCurs)
router.post('/vupok', protect, vupok)
router.post('/userCurs', protect, userCurs)
router.post('/compsSotr', protect, compsSotr)
router.post('/addTimes', protect, addTimes)
router.post('/deleteAkkPers', protect, deleteAkkPers)

module.exports = router;
