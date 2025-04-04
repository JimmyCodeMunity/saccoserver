const mongoose = require('mongoose')


const adminSchema = new mongoose.Schema({
    username: {
        type: String,

    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Admin = mongoose.model('Admin',adminSchema)

module.exports = Admin;