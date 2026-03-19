import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name profilePicture status")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Auto-delete 24h logic if setting is 24H
    if (conversation.deleteSetting === "24H") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Message.deleteMany({
        conversationId,
        createdAt: { $lt: twentyFourHoursAgo }
      });
    }

    const messages = await Message.find({
      conversationId,
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateChatSettings = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { deleteSetting } = req.body;

    if (!["NEVER", "IMMEDIATE", "24H"].includes(deleteSetting)) {
      return res.status(400).json({ message: "Invalid delete setting" });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { deleteSetting },
      { new: true }
    );

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Only participants can clear history
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized to clear this chat" });
    }

    await Message.deleteMany({ conversationId });
    
    // Update last message to null
    conversation.lastMessage = null;
    await conversation.save();

    res.json({ success: true, message: "Chat history cleared permanently" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { forEveryone } = req.query;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (forEveryone === "true") {
      // Logic for Delete for Everyone
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Unauthorized to delete for everyone" });
      }
      message.isDeletedForEveryone = true;
      message.text = "This message was deleted";
      message.image = null;
      message.video = null;
    } else {
      // Logic for Delete for Me
      if (message.sender.toString() === userId.toString()) {
        message.senderDeleted = true;
      } else if (message.recipient.toString() === userId.toString()) {
        message.recipientDeleted = true;
      }
    }

    await message.save();
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const { recipientId, text, type = "text", image, giftId } = req.body;

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
    }

    const senderUser = await User.findById(req.user._id);
    
    // Check if sender is NOT a host. Hosts reply for free.
    if (!senderUser.isHost) {
      const messageCount = await Message.countDocuments({
        conversationId: conversation._id,
        sender: req.user._id
      });
      
      if (messageCount >= 10 || type === 'gift') {
        const cost = type === 'gift' ? 0 : 3; // Gift cost is handled in its own service
        if (senderUser.coins < cost) {
          return res.status(400).json({ 
            message: "Insufficient coins. Recharge now.",
            requiresRecharge: true
          });
        }
        
        if (cost > 0) {
          await User.findByIdAndUpdate(req.user._id, { $inc: { coins: -cost } });
        }
      }
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      recipient: recipientId,
      text,
      image,
      type,
      giftId
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
