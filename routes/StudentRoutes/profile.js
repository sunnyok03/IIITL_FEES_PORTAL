const express = require("express");
const router = express.Router();
const User = require("../../models/user");

async function calculateProfileData(profileData, email) {
  const user = await User.findOne({ email: email });
  for (let sem of user.semester) {
    if (sem.feeStatus == "paid") {
      profileData.feesPaid += sem.amount;
    } else {
      profileData.feesPending += sem.amount;
    }

    if (sem.feeType == "Fine" || sem.fineAmount > 0) {
      profileData.fineNumber += 1;
      profileData.fineAmount += sem.fineAmount;
    }
    if (sem.feeType == "Fine") profileData.fineAmount += sem.amount;
  }
}

router.get("/", async (req, res) => {
  let { email } = req.user;
  let profileData = {
    feesPaid: 0,
    fineAmount: 0,
    feesPending: 0,
    fineNumber: 0,
  };
  await calculateProfileData(profileData, email);
  res.render("Student/profile", {
    profileData,
  });
});

module.exports = router;
