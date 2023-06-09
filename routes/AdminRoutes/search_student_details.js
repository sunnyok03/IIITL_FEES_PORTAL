const express = require("express");
const router = express.Router();
const User = require("../../models/user");

function convertToLower(str) {
  return str.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

router.get("/", (req, res) => {
  const data = null;
  res.render("Admin/search_student_details", {
    data: data,
    valid: "",
  });
});

router.post("/", async (req, res) => {
  let { rollNumber } = req.body;
  rollNumber = convertToLower(rollNumber);
  const email = rollNumber + "@iiitl.ac.in";
  let data = await User.findOne({ email: email });
  let valid = "";
  let studentEmail, studentRoll, studentName;
  if (data == null) {
    valid = "Roll Number does not exist...";
  } else {
    valid = "";
    studentEmail = data.email;
    studentRoll = data.roll;
    studentName = data.name;
    data = data.semester;
  }

  res.render("Admin/search_student_details", {
    data,
    studentName,
    studentRoll,
    studentEmail,
    valid: valid,
  });
});

module.exports = router;
