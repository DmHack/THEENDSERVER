const asyncHandler = require('express-async-handler');
const Cryptr = require('cryptr');
const Goal = require('../models/progModel');
const User = require('../models/userModel');

const cryptr = new Cryptr(process.env.CRYPTR);



const getGoals = asyncHandler(async (req, res) => {
    Goal.find({}).sort({ createdAt: -1 }).exec(function (err, doc) {
        for (let i = 0; i < doc.length; i++) {
            doc[i].text = cryptr.decrypt(doc[i].text)
            doc[i].title = cryptr.decrypt(doc[i].title)
        }
        res.status(200).json({
            progs: doc,
        });
    });

})


const getGoalsMe = asyncHandler(async (req, res) => {

    Goal.find({ user: req.user.id }).sort({ createdAt: -1 }).exec(function (err, doc) {
        for (let i = 0; i < doc.length; i++) {
            doc[i].text = cryptr.decrypt(doc[i].text)
            doc[i].title = cryptr.decrypt(doc[i].title)
        }
        res.status(200).json({
            doc,
        });
    });
})


const getGoal = asyncHandler(async (req, res) => {
    const goals = await Goal.findById(req.body.id)
    goals.text = cryptr.decrypt(goals.text)
    goals.title = cryptr.decrypt(goals.title)

    res.status(200).json({
        goals,
    });
})

const setGoals = asyncHandler(async (req, res) => {
    const { img, name } = await User.findById(req.user.id)
    if (!req.body.text) {
        res.status(400)
        throw new Error('Please add a text field')
    };

    const goal = await Goal.create({
        text: cryptr.encrypt(req.body.text),
        title: cryptr.encrypt(req.body.title),
        user: req.body.user,
        progUrl: req.body.progUrl,
        prog: req.body.prog,
        tag: req.body.tag,
        avatar: img,
        userName: name,
    })

    goal.title = cryptr.decrypt(goal.title)
    goal.text = cryptr.decrypt(goal.text)
    res.status(200).json(goal);
})

const updateGoals = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)

    if (!goal) {
        res.status(400)
        throw new Error('Goal not found')
    }

    const user = await User.findById(req.user.id)

    if (!user) {
        res.status(401)
        throw new Error('User not found')
    }

    if (goal.user.toString() !== user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }

    const updateGoal = await Goal.findByIdAndUpdate(req.params.id, { text: cryptr.encrypt(req.body.text) }, { new: true })
    console.log(req.body);
    res.status(200).json(updateGoal);
})

const deleteGoals = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)

    if (!goal) {
        res.status(400)
        throw new Error('Goal not found')
    }

    const user = await User.findById(req.user.id)

    if (!user) {
        res.status(401)
        throw new Error('User not found')
    }

    if (goal.user.toString() !== user.id) {
        res.status(401)
        throw new Error('User not authorized')
    }

    await Goal.findByIdAndDelete(req.params.id)

    res.status(200).json({ id: req.params.id });
})


module.exports = {
    getGoals,
    getGoalsMe,
    getGoal,
    setGoals,
    updateGoals,
    deleteGoals,
}