const express = require("express");
const router = express.Router();
const User = require("../../models/user");
const Batch = require("../../models/batch");
const semester = require("../../views/Admin/SemesterData.js");

async function calculateDashboardData(dashboardData, users) {
  for (let user of users) {
    for (let sem of user.semester) {
      if (sem.feeStatus == "pending") {
        dashboardData.feesPending += sem.amount;
      } else {
        dashboardData.feesPaid += sem.amount;
        if (sem.feeType == "Semester") {
          dashboardData.chart2Data[0] += sem.amount;
        } else if (sem.feeType == "Mess") {
          dashboardData.chart2Data[1] += sem.amount;
        } else if (sem.feeType == "Fine") {
          dashboardData.chart2Data[2] += sem.amount;
        }
      }
    }
  }
}

async function calculateMonthlyData(dashboardData, users) {
  for (let user of users) {
    for (let sem of user.semester) {
      if (sem.feeStatus == "paid") {
        let idx = sem.paymentDate.slice(5, 7);
        idx = parseInt(idx) - 1;
        dashboardData.monthlyFeesCollected[idx] += sem.amount;
      }
    }
  }
}

router.get("/", async (req, res) => {
  const batches = await Batch.find({});
  const users = await User.find({});
  let totalStudents = 0;
  const batchSize = batches.length;
  batches.forEach((batch) => {
    totalStudents += batch.batchStrength;
  });
  let dashboardData = {
    feesPending: 0,
    feesPaid: 0,
    chart2Data: [0, 0, 0], //[semesterPaid,messPaid,finePaid]
    monthlyFeesCollected: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // jan to dec
  };
  await calculateDashboardData(dashboardData, users);
  await calculateMonthlyData(dashboardData, users);

  res.render("Admin/dashboard", {
    semester,
    batchSize,
    totalStudents,
    dashboardData,
  });
});

module.exports = router;
