const express = require("express");
const router = express.Router();
const Chat = require("../../models/chat");

router.get("/", async (req, res) => {
  let { email } = req.user;
  let messages = Chat.findChat(email);

  res.render("Student/chat", {
    messages,
  });
});

router.post("/", async (req, res) => {
  const { message, textEmail } = req.body;
  const messages = await Chat.findOne({ senderEmail: textEmail });
  const unreadCount = messages.unreadCount;
  await Chat.findChatAndUpdate({
    senderEmail: textEmail,
    textEmail: textEmail,
    message: message,
    unreadCount: unreadCount + 1,
  });
  res.redirect("/chat/");
});

module.exports = router;
