const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');


const app = express();

app.use(express.json())
app.use(cors())

// if (process.env.NODE_ENV !== 'production') {
require('dotenv').config({
    path: './.env'
})
// }
const port = process.env.PORT;
const database = process.env.DBURL;

app.listen(port, (req, res) => {
    console.log(`server running on port ${port}`)
})

app.get('/', (req, res) => {
    res.send("Hello SAcco")
})

// database connection
mongoose.connect(database).then(() => {
    console.log("Database connected!!")
})
    .catch((error) => {
        console.log("error connecting to database", error)
    })


const adminroutes = require('./routes/AdminRoutes')
const userroutes = require('./routes/UserRoutes')
const staffroutes = require('./routes/StaffRoutes')

app.use('/api/v1/admin/', adminroutes)
app.use('/api/v1/user/', userroutes)
app.use('/api/v1/staff/', staffroutes)