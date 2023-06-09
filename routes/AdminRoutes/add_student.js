const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Batch = require("../../models/batch");
const Chat = require("../../models/chat");

function convertToLower(str) {
  return str.replace(/[A-Z]/g, (match) => match.toLowerCase());
}

router.get("/", (req, res) => {
  res.render("Admin/add_student");
});

router.post("/", async (req, res) => {
  let { batch, batchStrength, rollPrefix } = req.body;
  rollPrefix = convertToLower(rollPrefix);
  await Batch.findOneAndUpdate(
    { batch: batch },
    { batchStrength, rollPrefix },
    { new: true, upsert: true }
  );
  for (let i = 1; i <= batchStrength; i++) {
    let email = rollPrefix + i + "@iiitl.ac.in";
    if (i < 10) email = rollPrefix + "0" + i + "@iiitl.ac.in";
    await User.findOneAndUpdate(
      { email: email },
      { semester: [] },
      { new: true, upsert: true }
    );
    await Chat.findOneAndUpdate(
      { senderEmail: email },
      { chat: [] },
      { new: true, upsert: true }
    );
  }
  req.flash(
    "success",
    `Added new batch "${batch}" of ${batchStrength} students.`
  );
  res.redirect("/add_student/");
});

module.exports = router;
