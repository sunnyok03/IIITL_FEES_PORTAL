const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const { storage } = require("../../cloudinary/index.js");
//pdf file upload setup
const multer = require("multer");
const upload = multer({ storage });
const semester = require("../../views/Admin/SemesterData.js");

function convertDateFormat(str) {
  let date = new Date(str),
    mnth = ("0" + (date.getMonth() + 1)).slice(-2),
    day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}

router.get("/", async (req, res) => {
  let { studentEmail, studentRoll, transID } = req.query;
  let feeData;
  await User.findOne(
    {
      email: studentEmail,
      "semester._id": transID,
    },
    {
      "semester.$": 1,
    }
  ).then((user) => {
    const semester = user.semester[0]; // the matching semester object
    feeData = semester;
  });
  res.render("Admin/payment_confirmation", {
    semester: semester,
    formData: {
      studentRoll,
      studentEmail,
      amount: feeData.amount,
      semNo: feeData.semNo,
      fineAmount: feeData.fineAmount,
      feeType: feeData.feeType,
      transID,
    },
  });
});

router.post("/", upload.single("reciept"), async (req, res) => {
  let { SBIref, paymentDate, transID, email } = req.body;
  paymentDate = convertDateFormat(paymentDate);
  const user = await User.findOne({
    email: email,
  }).populate({ path: "semester" });
  for (let sem of user.semester) {
    if (sem._id == transID) {
      sem.feeStatus = "paid";
      sem.SBIref = SBIref;
      sem.paymentDate = paymentDate;
      if (req.file) {
        sem.receiptURL = req.file.path;
      }
      await user.save();
    }
  }
  req.flash("success", `Payment Confirmation sent to ${email}`);
  res.redirect("/search_student_details/");
});

module.exports = router;
