const express = require('express');
const { getUserData, userLogin, deleteUser, updateUser, createUser, createTicket, getTicketsByUser, getUserOpenTickets, getUserClosedTickets, deleteTicket } = require('../controllers/UserController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({extended:true}))




// admin routes
router.post("/userlogin",userLogin)
router.post("/userdata",getUserData)
router.post("/createuser",createUser)
router.post("/createticket",createTicket)
router.get("/getmytickets/:userid",getTicketsByUser)
router.get("/getmyopentickets/:userid",getUserOpenTickets)
router.get("/getmyclosedtickets/:userid",getUserClosedTickets)


// delete
router.delete("/deleteuser/:id",deleteUser)
router.put("/updateuser/:id",updateUser)
router.delete("/deleteticket/:id",deleteTicket)

module.exports = router;