const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    compName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
    },
    curs: {
        type: {}
    },
    vupolnsCurs: {
        type: []
    },
    not: {
        type: String,
        default: false
    },
    notif: {
        type: String,
        default: true
    },
    dogov: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, 'Please add a email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
    },
    code: {
        type: String,
        default: '',
    },
    refresh: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
});


module.exports = mongoose.model('Users', userSchema)