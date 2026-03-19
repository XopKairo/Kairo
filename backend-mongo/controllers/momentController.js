import Moment from "../models/Moment.js";
import Host from "../models/Host.js";

export const addMoment = async (req, res) => {
  try {
    const { mediaUrl, mediaType, title, isFeatured } = req.body;
    const moment = await Moment.create({
      userId: req.user._id,
      mediaUrl,
      mediaType,
      title,
      isFeatured
    });

    // Also update Host profile record if needed
    if (isFeatured) {
      await Host.findOneAndUpdate(
        { userId: req.user._id },
        { $push: { featuredMoments: moment._id } }
      );
    }

    res.status(201).json({ success: true, moment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyMoments = async (req, res) => {
  try {
    const moments = await Moment.find({ userId: req.user._id }).sort("order -createdAt");
    res.json(moments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHostMoments = async (req, res) => {
  try {
    const { hostId } = req.params; // This is the Host document _id
    const host = await Host.findById(hostId);
    if (!host) return res.status(404).json({ message: "Host not found" });

    const moments = await Moment.find({ userId: host.userId }).sort("order -createdAt");
    res.json(moments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMoment = async (req, res) => {
  try {
    const moment = await Moment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!moment) return res.status(404).json({ message: "Moment not found" });
    
    // Remove from Host featured list
    await Host.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { featuredMoments: moment._id } }
    );

    res.json({ success: true, message: "Moment deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};