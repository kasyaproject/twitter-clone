import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// profil user
export const getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id); // User yang ingin di follow/unfollow
    const yourself = await User.findById(req.user._id); // ID Saya sebagai user agar tidak muncul di pencarian

    // Cek id sendiri
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    if (!targetUser || !yourself) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = yourself.following.includes(id);
    if (isFollowing) {
      // Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      return res.status(200).json({ message: "Unfollowed" });
    } else {
      // Follow user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // kirim Notif ke user yang di follow
      const notif = new Notification({
        type: "follow",
        from: req.user._id,
        to: targetUser._id,
      });

      await notif.save();

      // Response
      return res.status(200).json({ message: "Followed" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUser = async (req, res) => {
  try {
    const userId = req.user._id; // Id sendiri
    const usersFollowByMe = await User.findById(userId).select("following"); // ambil user yang di follow oleh saya

    // Ambil 10 data user selain saya
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    // filter user yang tidak di follow oleh saya
    const fillterUsers = users.filter(
      (user) => !usersFollowByMe.following.includes(user._id)
    );
    // ambil 4 data user yang di suggest
    const suggestUsers = fillterUsers.slice(0, 4);

    suggestUsers.forEach((user) => (user.password = null));

    return res.status(200).json(suggestUsers);
  } catch (error) {
    console.log("Error in getSuggestedUser", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const UpdateUserProfile = async (req, res) => {
  const { fullName, email, username, currentPassword, newPassword, bio, link } =
    req.body;
  let { profileImg, coverImg } = req.body;

  const userId = req.user._id;

  try {
    // Check ID user
    let user = await User.findById(userId);
    // return res.status(200).json(user);
    if (!user) return res.status(404).json({ message: "User not found !!" });

    // validasi jika field currentPassword & newPassword kosong
    if (
      (!newPassword && currentPassword) ||
      (!currentPassword && newPassword)
    ) {
      return res
        .status(400)
        .json({ message: "Current password and new password must be filled" });
    }

    // validasi jika field currentPassword & newPassword sama
    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isValidPassword)
        return res.status(400).json({ message: "Invalid current password" });

      // validasi jika newPassword kurang dari 6 character
      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Upload Image ke cloudinary
    if (profileImg) {
      // jika sudah ada profileImg maka akan dihapus dan di replace dengan yang baru
      if (user.profileImg) {
        const publicId = user.profileImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      const uploadedReponse = await cloudinary.uploader.upload(profileImg);
      profileImg = uploadedReponse.secure_url;
    }

    if (coverImg) {
      // jika sudah ada coverImg maka akan dihapus dan di replace dengan yang baru
      if (user.coverImg) {
        const publicId = user.coverImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      const uploadedReponse = await cloudinary.uploader.upload(coverImg);
      coverImg = uploadedReponse.secure_url;
    }

    // mengisi data dengan hasil input
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    // Simpan data di DB
    user = await user.save();

    // set password null pada saat di panggil response
    user.password = null;

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in UpdateUserProfile", error.message);
    res.status(500).json({ error: error.message });
  }
};
