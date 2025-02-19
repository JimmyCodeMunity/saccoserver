const mongoose = require('mongoose')


const ticketSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    departmentid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        default: null,
    },
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    priority: {
        type: String,
    },
    status:{
        type: String,
        default: 'Open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Ticket = mongoose.model('Ticket', ticketSchema)

module.exports = Ticket