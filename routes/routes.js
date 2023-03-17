const express = require('express');
const router = express.Router();
const { getGoals, setGoals, updateGoals, deleteGoals, getGoal, getGoalsMe } = require('../controllers/progController');


const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getGoals);
router.post('/pr', protect, getGoal);
router.post('/psMe', protect, getGoalsMe);
router.post('/', protect, setGoals);
router.put('/:id', protect, updateGoals);
router.delete('/:id', protect, deleteGoals);



module.exports = router;