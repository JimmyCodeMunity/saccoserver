const mongoose = require('mongoose')


const staffSchema = new mongoose.Schema({
    username: {
        type: String,

    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    password: {
        type: String
    },
    departmentid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Staff = mongoose.model('Staff', staffSchema)

module.exports = Staff