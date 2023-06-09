const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Batch = require("../../models/batch");
const semester = require("../../views/Admin/SemesterData.js");

function convertDateFormat(str) {
  let date = new Date(str),
    mnth = ("0" + (date.getMonth() + 1)).slice(-2),
    day = ("0" + date.getDate()).slice(-2);
  return [date.getFullYear(), mnth, day].join("-");
}

function convertToLower(str) {
  return str.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

router.get("/", async (req, res) => {
  const batch = [];
  async function getItems() {
    return await Batch.find({});
  }

  await getItems().then(function (FoundItems) {
    FoundItems.forEach(function (item) {
      batch.push(item.batch);
    });
  });

  res.render("Admin/send_payment_link", {
    batch: batch,
    semester: semester,
  });
});

router.post("/", async (req, res) => {
  let { branch, roll, dueDate } = req.body;
  roll = convertToLower(roll);
  dueDate = convertDateFormat(dueDate);

  if (roll == "") {
    const batch = await Batch.findOne({ batch: branch });
    for (let i = 1; i <= batch.batchStrength; i++) {
      let email = batch.rollPrefix + i + "@iiitl.ac.in";
      if (i < 10) email = batch.rollPrefix + "0" + i + "@iiitl.ac.in";
      await User.findOneAndAddFee({
        email,
        amount: req.body.amount,
        semNo: req.body.semNo,
        feeType: req.body.feeType,
        paymentLink: req.body.paymentLink,
        dueDate: dueDate,
      });
    }
  } else {
    const email = roll + "@iiitl.ac.in";
    await User.findOneAndAddFee({
      email,
      amount: req.body.amount,
      semNo: req.body.semNo,
      feeType: req.body.feeType,
      paymentLink: req.body.paymentLink,
      dueDate: dueDate,
    });
  }
  req.flash("success", "Payment link sent.");
  res.redirect("/send_payment_link/");
});

module.exports = router;
