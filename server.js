const express = require("express");
const app = express();
const passport = require("passport");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user");
const Batch = require("./models/batch");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const path = require("path");
const CronJob = require("cron").CronJob;
app.use(express.json());
require("dotenv").config();

const dashboardRoutes = require("./routes/AdminRoutes/dashboard");
const paymentConfirmationRoutes = require("./routes/AdminRoutes/payment_confirmation");
const searchStudentDetailsRoutes = require("./routes/AdminRoutes/search_student_details");
const sendPaymentLinkRoutes = require("./routes/AdminRoutes/send_payment_link");
const addStudentRoutes = require("./routes/AdminRoutes/add_student");
const answerQueriesRoutes = require("./routes/AdminRoutes/answer_queries");
const profileRoutes = require("./routes/StudentRoutes/profile");
const payFeesRoutes = require("./routes/StudentRoutes/pay_fees");
const paymentHistoryRoutes = require("./routes/StudentRoutes/payment_history");
const downloadReceiptRoutes = require("./routes/StudentRoutes/download_receipt");
const chatRoutes = require("./routes/StudentRoutes/chat");

const dbUrl =
  process.env.DB_URL || "mongodb://127.0.0.1:27017/IIITL_Fee_Portal";
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connection open ");
  })
  .catch((err) => {
    console.log(err);
    console.log("Error occurs");
  });

const PORT = process.env.PORT || 5000;

require("./auth");
// Middle part

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

function isLoggedIn(req, res, next) {
  req.user ? next() : res.redirect("/login");
}

async function isAdmin(req, res, next) {
  return next();
  let userData = await User.findOne({ email: req.user.email }).exec();
  if (userData == null) {
    res.send("Email ID Not Registered");
  } else {
    const user = await User.findOne({
      email: userData.email,
    });
    user.name = req.user.displayName;
    await user.save();
    const role = userData.role;
    userData.role && role == "admin" ? next() : res.redirect("/profile");
  }
}

app.use(
  session({
    secret: "mypassword",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//flash messages
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  next();
});

app.get("/auth/protected", isLoggedIn, (req, res) => {
  //google auth's data
  app.locals.userName = req.user.displayName;
  app.locals.email = req.user.email;
  app.locals.rollNumber = req.user.email.slice(0, req.user.email.indexOf("@"));
  app.locals.picture = req.user.picture;
  res.redirect("/dashboard");
});

app.use("/auth/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//mongodb login signup
app.post("/signUp", async (req, res) => {
  const { password, username, confirmpassword, email } = req.body;
  if (confirmpassword === password) {
    const hash = await bcrypt.hash(password, 12);
    const user = new User({
      username,
      email,
      password: hash,
    });

    await user.save();
    res.redirect("Admin/dashboard");
  } else {
    res.send("Confirm password once again");
  }
});

app.post("/Login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  const validpass = await bcrypt.compare(password, user.password);

  if (validpass) {
    res.status(200).redirect("/");
    // res.redirect('/')
  } else {
    res.status(200).send("Try correct password");
  }
});

app.get("/login", (req, res) => {
  res.render("Login");
});

app.get("/", (req, res) => {
  res.render("../public/homepage/homepage");
});

//google login
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    hostedDomain: "iiitl.ac.in",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/protected",
    failureRedirect: "/auth/google/failure",
  })
);

app.get("/auth/google/failure", (req, res) => {
  res.send("not log in");
});

//Admin Panel
app.use("/dashboard", [isLoggedIn, isAdmin], dashboardRoutes);
app.use(
  "/payment_confirmation",
  [isLoggedIn, isAdmin],
  paymentConfirmationRoutes
);
app.use(
  "/search_student_details",
  [isLoggedIn, isAdmin],
  searchStudentDetailsRoutes
);
app.use("/send_payment_link", [isLoggedIn, isAdmin], sendPaymentLinkRoutes);
app.use("/add_student", [isLoggedIn, isAdmin], addStudentRoutes);
app.use("/answer_queries", [isLoggedIn, isAdmin], answerQueriesRoutes);

//Student Panel
app.use("/profile", isLoggedIn, profileRoutes);
app.use("/pay_fees", isLoggedIn, payFeesRoutes);
app.use("/payment_history", isLoggedIn, paymentHistoryRoutes);
app.use("/download_receipt", isLoggedIn, downloadReceiptRoutes);
app.use("/chat", isLoggedIn, chatRoutes);

const job = new CronJob(
  "00 00 00 * * *",
  async function () {
    const batch = await Batch.find({}).exec();
    for (let j = 0; j < batch.length; j++) {
      const batch_strength = batch[j].batchStrength;
      const roll_prefix = batch[j].rollPrefix;
      for (let i = 1; i <= batch_strength; i++) {
        let email = roll_prefix + i + "@iiitl.ac.in";
        if (i < 10) email = roll_prefix + "0" + i + "@iiitl.ac.in";
        const user = await User.findOne({
          email: email,
        }).populate({ path: "semester" });
        for (let sem of user.semester) {
          const dueDate = new Date(sem.dueDate); // example due date
          const currentDate = new Date();
          const difference = currentDate.getTime() - dueDate.getTime();
          const differenceInDays =
            Math.ceil(difference / (1000 * 60 * 60 * 24)) - 1;
          if (
            sem.feeType != "fine" &&
            differenceInDays > 0 &&
            differenceInDays <= 5
          ) {
            sem.fineAmount = 1000;
          } else if (sem.feeType != "fine" && differenceInDays > 5) {
            sem.fineAmount = 5000;
          }
          await user.save();
        }
      }
    }
  },
  null,
  true,
  "Asia/Kolkata"
);
job.start();

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
