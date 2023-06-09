const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  senderEmail: {
    type: String,
    unique: true,
  },
  chat: [
    {
      message: {
        type: String,
        default: "",
      },
      textEmail: {
        type: String,
        default: "",
      },
    },
  ],
  unreadCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  lastUpdated: {
    type: Date,
  },
});

//get all messages in sorted order by time
chatSchema.statics.findAndSort = async function () {
  let chats = await this.find({});
  chats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  return chats;
};

//add new message sent by user or admin
chatSchema.statics.findChatAndUpdate = async function ({
  senderEmail,
  textEmail,
  message,
  unreadCount,
}) {
  await this.findOneAndUpdate(
    {
      senderEmail: senderEmail,
    },
    {
      $push: {
        chat: {
          textEmail: textEmail,
          message: message,
        },
      },
      lastUpdated: new Date(),
      unreadCount: unreadCount,
    },
    {
      new: true,
      upsert: true,
    }
  );
};

//delete a chat
chatSchema.statics.deleteChat = async function (senderEmail) {
  const chats = await this.findOne({
    senderEmail,
  });
  chats.chat = [];
  chats.unreadCount = 0;
  chats.save();
};

//find chat array of a particular student
chatSchema.statics.findChat = async function (senderEmail) {
  const messages =
    (
      await this.findOne({ senderEmail }).populate({
        path: "chat",
      })
    ).chat || [];
  return messages;
};

module.exports = mongoose.model("Chat", chatSchema);
