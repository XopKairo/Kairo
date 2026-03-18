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

export default router;
