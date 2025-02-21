const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const { Server } = require("socket.io");
const http = require("http");


const app = express();

app.use(express.json())
app.use(cors())

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // origin: ["http://localhost:3000", "http://localhost:3001","https://cbfe-41-139-202-31.ngrok-free.app"], // Add multiple origins here
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// if (process.env.NODE_ENV !== 'production') {
require('dotenv').config({
    path: './.env'
})


// socket
const users = new Map(); // Store all logged-in users
const admins = new Map();
const staff = new Map();
console.log("socket users", users)




io.on("connection", (socket) => {
    console.log(`User ${socket.id} connected`);

    const { userId, role } = socket.handshake.query; // Get user ID and role from client
    console.log(`User ${socket.id} connected has id ${userId} and role ${role}`);
    if (userId && role) {
        if (role === "user") users.set(userId, socket.id);
        if (role === "admin") admins.set(userId, socket.id);
        if (role === "staff") staff.set(userId, socket.id);
    }

    socket.on("send_message", (data) => {
        console.log("message", data);
        socket.broadcast.emit("receive_message", data);
    });

    // socket.on("notify",(data)=>{
    //     console.log("sender",data)

    // })

    socket.on("notify", async (data) => {
        const { senderId, message, receiver } = data; // Extract notification data
        console.log(`Notification from ${senderId} to ${receiver}: ${message}`);

        try {
            const dept = await Ticket.findById(receiver)
                .populate('departmentid', 'deptname depthead assignedStatus')
                ;
            if (!dept) {
                console.log("Department not found");
                return;
            }
            let rec = null;
            console.log("Department:", dept);
            console.log("Departhead:", dept?.departmentid?.depthead);
            if(dept){
                rec = dept?.departmentid?.depthead?.toString();
            }

            const receiverSocketId = staff.get(rec.toString());
            console.log("Receiver Socket ID:", receiverSocketId);
            // return

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_notification", { senderId, message });
                console.log(`Notification sent to user ${receiver}`);
            } else {
                console.log(`User ${receiver} is not online`);
            }
        } catch (error) {
            console.error("Error getting department:", error);
        }
    });



    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);

        // Remove user from the correct map
        for (const [id, sid] of users.entries()) {
            if (sid === socket.id) {
                users.delete(id);
                break;
            }
        }
        for (const [id, sid] of admins.entries()) {
            if (sid === socket.id) {
                admins.delete(id);
                break;
            }
        }
        for (const [id, sid] of staff.entries()) {
            if (sid === socket.id) {
                staff.delete(id);
                break;
            }
        }
    });
});
// }
const port = process.env.PORT;
const database = process.env.DBURL;




server.listen(port, (req, res) => {
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
const staffroutes = require('./routes/StaffRoutes');
const Department = require('./models/DepartmentModel');
const Ticket = require('./models/TicketModel');

app.use('/api/v1/admin/', adminroutes)
app.use('/api/v1/user/', userroutes)
app.use('/api/v1/staff/', staffroutes)