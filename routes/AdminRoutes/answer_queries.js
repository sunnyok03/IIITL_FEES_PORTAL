const express = require("express");
const router = express.Router();
const Chat = require("../../models/chat");

router.get("/", async (req, res) => {
  res.render("Admin/answer_queries", {
    orderedChats: await Chat.findAndSort(),
  });
});

router.post("/", async (req, res) => {
  const { message, textEmail } = req.body;
  await Chat.findChatAndUpdate({
    senderEmail: textEmail,
    textEmail: "admin",
    message: message,
    unreadCount: 0,
  });
  res.redirect("/answer_queries/");
});

router.post("/deleteChat/", async (req, res) => {
  const { textEmail } = req.body;
  await Chat.deleteChat(textEmail);
  res.redirect("/answer_queries/");
});

module.exports = router;
