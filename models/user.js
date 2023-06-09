const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    default: "student",
  },
  email: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    default: "",
  },
  semester: [
    {
      amount: {
        type: Number,
        default: 0,
      },
      fineAmount: {
        type: Number,
        default: 0,
      },
      SBIref: {
        type: String,
        default: "",
      },
      semNo: {
        type: String,
        default: "",
      },
      feeType: {
        type: String,
        default: "",
      },
      paymentLink: {
        type: String,
        default: "",
      },
      paymentDate: {
        type: String,
        default: "",
      },
      dueDate: {
        type: String,
      },
      feeStatus: {
        type: String,
        default: "pending",
      },
      receiptURL: {
        type: String,
        default: "",
      },
    },
  ],
});

userSchema.virtual("roll").get(function () {
  const roll = this.email.slice(0, this.email.indexOf("@"));
  return roll;
});

userSchema.statics.findOneAndAddFee = async function ({
  email,
  amount,
  semNo,
  feeType,
  paymentLink,
  dueDate,
}) {
  await this.findOneAndUpdate(
    {
      email: email,
    },
    {
      $push: {
        semester: {
          amount,
          semNo,
          feeType,
          paymentLink,
          dueDate,
        },
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
};

module.exports = mongoose.model("User", userSchema);
