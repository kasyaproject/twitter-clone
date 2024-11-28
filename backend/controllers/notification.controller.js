import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notification = await Notification.find({ to: userId }).populate({
      path: "from",
      select: "username profileImg",
    });

    await Notification.updateMany({ to: userId }, { read: true });

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error in getNotifications Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notification delete successfully" });
  } catch (error) {
    console.error("Error in deleteNotifications Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
