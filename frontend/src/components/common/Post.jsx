import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const formattedDate = formatPostDate(post.createdAt);

  const queryClient = useQueryClient();
  // Deleting post
  const postOwner = post.user;
  const isMyPost = authUser._id === postOwner._id;
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`api/post/${post._id}`, {
          method: "DELETE",
        });
        const data = res.json();

        if (!res.ok) throw new Error(data.message || "Something went error");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Post Delete Successfully");
      // Refetch untuk menrefresh data post
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Likeing post
  const isLiked = post.likes.includes(authUser._id);
  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/post/like/${post._id}`, {
          method: "POST",
        });
        const data = res.json();

        if (!res.ok) throw new Error(data.message || "Something went error");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedLikes) => {
      // memperbarui data lokal yang ada di cache (query client)
      queryClient.setQueryData(["posts"], (oldData) => {
        return oldData.map((item) => {
          if (item._id === post._id) {
            return { ...item, likes: updatedLikes };
          }
          return item;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Comment post
  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/post/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Something went error");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedComments) => {
      toast.success("Comment post successfully");
      setComment("");
      // queryClient.invalidateQueries({ queryKey: ["posts"] });

      // memperbarui data lokal yang ada di cache (query client)
      queryClient.setQueryData(["posts"], (oldData) => {
        return oldData.map((item) => {
          if (item._id === post._id) {
            return { ...item, comments: updatedComments };
          }
          return item;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();

    if (isCommenting) return;
    commentPost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  return (
    <>
      <div className="flex items-start gap-2 p-4 border-b border-gray-700">
        <div className="avatar">
          <Link
            to={`/profile/${postOwner.username}`}
            className="w-8 h-8 overflow-hidden rounded-full"
          >
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
          </Link>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${postOwner.username}`} className="font-bold">
              {postOwner.fullName}
            </Link>
            <span className="flex gap-1 text-sm text-gray-700">
              <Link to={`/profile/${postOwner.username}`}>
                @{postOwner.username}
              </Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <FaTrash
                    className="cursor-pointer hover:text-red-500"
                    onClick={handleDeletePost}
                  />
                )}

                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 overflow-hidden">
            <span>{post.content}</span>
            {post.img && (
              <img
                src={post.img}
                className="object-contain border border-gray-700 rounded-lg h-80"
                alt=""
              />
            )}
          </div>
          <div className="flex justify-between mt-3">
            <div className="flex items-center justify-between w-2/3 gap-4">
              <div
                className="flex items-center gap-1 cursor-pointer group"
                onClick={() =>
                  document
                    .getElementById("comments_modal" + post._id)
                    .showModal()
                }
              >
                <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {post.comments.length}
                </span>
              </div>
              {/* We're using Modal Component from DaisyUI */}
              <dialog
                id={`comments_modal${post._id}`}
                className="border-none outline-none modal"
              >
                <div className="border border-gray-600 rounded modal-box">
                  <h3 className="mb-4 text-lg font-bold">COMMENTS</h3>
                  <div className="flex flex-col gap-3 overflow-auto max-h-60">
                    {post.comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-2">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img
                              className="object-fill border border-gray-700 rounded-lg h-80"
                              src={
                                comment.user.profileImg ||
                                "/avatar-placeholder.png"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">
                              {comment.user.fullName}
                            </span>
                            <span className="text-sm text-gray-700">
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex items-center gap-2 pt-2 mt-4 border-t border-gray-600"
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className="w-full p-1 border border-gray-800 rounded resize-none textarea text-md focus:outline-none"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button className="px-4 text-white rounded-full btn btn-primary btn-sm">
                      {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                    </button>
                  </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>
              <div className="flex items-center gap-1 cursor-pointer group">
                <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
                <span className="text-sm text-slate-500 group-hover:text-green-500">
                  0
                </span>
              </div>
              <div
                className="flex items-center gap-1 cursor-pointer group"
                onClick={handleLikePost}
              >
                {isLiking && <LoadingSpinner size="sm" />}
                {!isLiked && !isLiking && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                )}
                {isLiked && !isLiking && (
                  <FaHeart className="w-4 h-4 text-pink-500 cursor-pointer " />
                )}

                <span
                  className={`text-sm text-slate-500 group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : ""
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end w-1/3 gap-2">
              <FaRegBookmark className="w-4 h-4 cursor-pointer text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Post;
