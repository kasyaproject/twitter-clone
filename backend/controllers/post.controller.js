import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getAllPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllLikesPost = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const likedPost = await Post.find({
      _id: { $in: user.likedPosts },
    })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(likedPost);
  } catch (error) {
    console.error("Error in getAllLikesPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFollowingPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const following = user.following;
    const feedPost = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(feedPost);
  } catch (error) {
    console.error("Error in getFollowingPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserPost = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getUserPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    // Validasi untuk user, content, dan img
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!content && !img)
      return res.status(400).json({ message: "Content or image is required" });

    // jika ada img yang di upload
    if (img) {
      // upload image ke cloudinary
      const uploadImg = await cloudinary.uploader.upload(img);
      img = uploadImg.secure_url;
    }

    // jika validasi berhasil buat post baru ke DB
    const newPost = new Post({
      user: userId,
      content,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error in createPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const postId = await Post.findById(req.params.id);
    if (!postId) return res.status(404).json({ message: "Post not found" });

    if (postId.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });

    if (postId.img) {
      // delete image from cloudinary
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    // Ambil semua info dan input field
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    // validasi jika field text kosong
    if (!text) return res.status(400).json({ message: "Content is required" });

    // Ambil post yang ingin di comment
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Simpan comment di DB
    const comment = { user: userId, text };

    post.comments.push(comment);
    await post.save();

    const updatedComments = post.comments;
    res.status(201).json(updatedComments);
  } catch (error) {
    console.error("Error in commentOnPost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    //
    const userLikePost = post.likes.includes(userId);
    if (userLikePost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );

      res.status(200).json(updatedLikes);
    } else {
      // Like post
      post.likes.push(userId);

      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      await post.save();

      // Buat notifikasi ke User Post
      const notification = new Notification({
        from: userId,
        to: post.user,
        type: "like",
      });
      await notification.save();

      const updatedLikes = post.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.error("Error in likeUnlikePost Controller ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
