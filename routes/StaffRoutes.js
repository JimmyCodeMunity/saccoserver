const express = require('express');
const { staffLogin, getStaffData, createStaff, deleteStaff, updateStaff, getTickets, getTicketsByDeptHead, getStaffTickets, getStaffClosedTickets } = require('../controllers/StaffController');
const router = express.Router();
router.use(express.json())
router.use(express.urlencoded({ extended: true }))




// admin routes
router.post("/stafflogin", staffLogin)
router.post("/staffdata", getStaffData)
router.post("/createstaff", createStaff)
// // router.get("/gettickets", getTickets)
// router.get("/getticketsbydepthead/:depthead", getTicketsByDeptHead)
// router.get("/getticketsbydeptid/:departmentid", getTicketsByDeptHead)
router.get("/getstafftickets/:departmentid", getStaffTickets)
router.get("/getstaffclosedtickets/:departmentid", getStaffClosedTickets)


// delete
router.delete("/deletestaff/:id", deleteStaff)
router.put("/updatestaff/:id", updateStaff)

module.exports = router;