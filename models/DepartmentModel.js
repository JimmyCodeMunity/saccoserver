const mongoose = require('mongoose')


const departmentSchema = new mongoose.Schema({
    deptname: {
        type: String,

    },
    depthead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        default: null,
    },
    assignedStatus: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Department = mongoose.model('Department', departmentSchema)

module.exports = Department