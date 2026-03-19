import express from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  updateChatSettings,
  clearChatHistory,
} from "../controllers/chatController.js";
import { protectUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectUser);

router.get("/conversations", getConversations);
router.get("/messages/:conversationId", getMessages);
router.post("/send", sendMessage);
router.put("/settings/:conversationId", updateChatSettings);
router.delete("/history/:conversationId", clearChatHistory);
router.delete("/messages/:messageId", (req, res, next) => {
  // We'll add this to chatController soon
  import("../controllers/chatController.js").then(ctrl => ctrl.deleteMessage(req, res)).catch(next);
});

export default router;
