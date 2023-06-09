const express = require("express");
const router = express.Router();
const User = require("../../models/user");

router.get("/", async (req, res) => {
  let { email } = req.user;
  let data;
  await User.find({ email: email, "semester.feeStatus": "paid" })
    .then((users) => {
      data = users.flatMap((user) =>
        user.semester.filter((sem) => sem.feeStatus === "paid")
      );
      data.sort((a, b) => a.semNo.localeCompare(b.semNo)); // Sort by semNo field
    })
    .catch((err) => console.log(err));
  res.render("Student/payment_history", {
    data,
  });
});

module.exports = router;
