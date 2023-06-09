const express = require("express");
const router = express.Router();
const User = require("../../models/user");

router.get("/", async (req, res) => {
  let { email } = req.user;
  let data;
  await User.find({ email: email, "semester.feeStatus": "pending" })
    .then((users) => {
      data = users.flatMap((user) =>
        user.semester.filter((sem) => sem.feeStatus === "pending")
      );
      data.sort((a, b) => a.semNo.localeCompare(b.semNo)); // Sort by semNo field
    })
    .catch((err) => console.log(err));
  res.render("Student/pay_fees", {
    data,
  });
});

module.exports = router;
