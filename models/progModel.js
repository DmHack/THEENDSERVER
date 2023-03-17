const mongoose = require('mongoose');

const progSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    userName: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: [true, 'Please add a text value']
    },
    title: {
        type: String,
        required: [true, 'Please add a text value']
    },
    prog: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
        required: true,
    },
    progUrl: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
})

module.exports = mongoose.model('Goal', progSchema)