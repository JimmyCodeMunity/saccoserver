const express = require('express');
const { createAdmin, adminLogin, getAdminData, createUser, createStaff, getUsers, getStaff, createDepartment, getDepartments, getAvailableDepartments, deleteStaff, deleteUser, updateUser, sendEmail, getOpenTickets, getClosedTickets, reassignDept, deleteTicket } = require('../controllers/AdminController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({extended:true}))




// admin routes
router.post("/createadmin",createAdmin)
router.post("/sendemail",sendEmail)
router.post("/adminlogin",adminLogin)
router.post("/admindata",getAdminData)
router.post("/createuser",createUser)
router.post("/createstaff",createStaff)
router.post("/createdepartment",createDepartment)
router.get("/getdepartments",getDepartments)
router.get("/getavailabledepartments",getAvailableDepartments)
router.get("/getusers",getUsers)
router.get("/getstaff",getStaff)
router.get("/getopentickets",getOpenTickets)
router.get("/getclosedtickets",getClosedTickets)
router.post("/reassigndept/:id",reassignDept)
router.delete("/deleteticket/:id",deleteTicket)

// delete
router.delete("/deletestaff/:id",deleteStaff)
router.delete("/deleteuser/:id",deleteUser)
router.put("/updateuser/:id",updateUser)

module.exports = router;