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
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .sort({ createdAt: 1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const { recipientId, text, type = "text", image } = req.body;

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
      
      if (messageCount >= 10) {
        if (senderUser.coins < 3) {
          return res.status(400).json({ 
            message: "Insufficient coins. After 10 free messages, each message costs 3 coins. Please recharge.",
            requiresRecharge: true
          });
        }
        
        // ATOMIC DEDUCTION: No race conditions
        const updatedSender = await User.findOneAndUpdate(
          { _id: req.user._id, coins: { $gte: 3 } },
          { $inc: { coins: -3 } },
          { new: true }
        );

        if (!updatedSender) {
          return res.status(400).json({ 
            message: "Transaction failed. Please try again.",
            requiresRecharge: true
          });
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
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
