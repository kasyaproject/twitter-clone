import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { POSTS } from "../../utils/db/dummy";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMemberSinceDate } from "../../utils/date";
import btnFollow from "../../hooks/btnFollow";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { username } = useParams();
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [feedType, setFeedType] = useState("posts");
  const queryClient = useQueryClient();

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  // Query untuk mendapatkan info user account
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  // Querty untuk mendapatkan info profile dengan username
  const {
    data: user,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/profile/${username}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Something went error");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  // Query untuk Follow/Unfollow account
  const { follow, isPending } = btnFollow();

  // Query untuk update Profile
  const { mutate: updateProfile, isPending: isUpdateingProfile } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("/api/users/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profileImg, coverImg }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Something went error");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Profile update successfully");
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
      ]);
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const isMyProfile = authUser._id === user?._id;
  const memberSince = formatMemberSinceDate(user?.createdAt);
  const iFollowing = authUser?.following.includes(user?._id);

  const handleImgChange = (e, state) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        state === "coverImg" && setCoverImg(reader.result);
        state === "profileImg" && setProfileImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    refetch();
  }, [username, refetch, username]);

  return (
    <>
      <div className="flex-[4_4_0]  border-r border-gray-700 min-h-screen ">
        {/* HEADER */}
        {(isLoading || isRefetching) && <ProfileHeaderSkeleton />}
        {!isLoading && !isRefetching && !user && (
          <p className="mt-4 text-lg text-center">User not found</p>
        )}
        <div className="flex flex-col">
          {!isLoading && !isRefetching && user && (
            <>
              <div className="flex items-center gap-10 px-4 py-2">
                <Link to="/">
                  <FaArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex flex-col">
                  <p className="text-lg font-bold">{user?.fullName}</p>
                  <span className="text-sm text-slate-500">
                    {POSTS?.length} posts
                  </span>
                </div>
              </div>
              {/* COVER IMG */}
              <div className="relative group/cover">
                <img
                  src={coverImg || user?.coverImg || "/cover.png"}
                  className="object-cover w-full h-52"
                  alt="cover image"
                />
                {isMyProfile && (
                  <div
                    className="absolute p-2 transition duration-200 bg-gray-800 bg-opacity-75 rounded-full opacity-0 cursor-pointer top-2 right-2 group-hover/cover:opacity-100"
                    onClick={() => coverImgRef.current.click()}
                  >
                    <MdEdit className="w-5 h-5 text-white" />
                  </div>
                )}

                <input
                  type="file"
                  hidden
                  accept="image/*"
                  ref={coverImgRef}
                  onChange={(e) => handleImgChange(e, "coverImg")}
                />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  ref={profileImgRef}
                  onChange={(e) => handleImgChange(e, "profileImg")}
                />
                {/* USER AVATAR */}
                <div className="absolute avatar -bottom-16 left-4">
                  <div className="relative w-32 rounded-full group/avatar">
                    <img
                      src={
                        profileImg ||
                        user?.profileImg ||
                        "/avatar-placeholder.png"
                      }
                    />
                    {isMyProfile && (
                      <div className="absolute p-1 rounded-full opacity-0 cursor-pointer top-5 right-3 bg-primary group-hover/avatar:opacity-100">
                        <MdEdit
                          className="w-4 h-4 text-white"
                          onClick={() => profileImgRef.current.click()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end px-4 mt-5">
                {isMyProfile && <EditProfileModal authUser={authUser} />}
                {!isMyProfile && (
                  <button
                    className="rounded-full btn btn-outline btn-sm"
                    onClick={() => follow(user?._id)}
                  >
                    {isPending && <LoadingSpinner size="xs" />}
                    {!isPending && iFollowing && "Unfollow"}
                    {!isPending && !iFollowing && "Follow"}
                  </button>
                )}
                {(coverImg || profileImg) && (
                  <button
                    className="px-4 ml-2 text-white rounded-full btn btn-primary btn-sm"
                    onClick={() => updateProfile()}
                  >
                    {isUpdateingProfile ? "Updateting..." : "Update"}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 px-4 mt-14">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">{user?.fullName}</span>
                  <span className="text-sm text-slate-500">
                    @{user?.username}
                  </span>
                  <span className="my-1 text-sm">{user?.bio}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user?.link && (
                    <div className="flex items-center gap-1 ">
                      <>
                        <FaLink className="w-3 h-3 text-slate-500" />
                        <a
                          href="https://youtube.com/@asaprogrammer_"
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          youtube.com/@asaprogrammer_
                        </a>
                      </>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-500">
                      {memberSince}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold">
                      {user?.following.length}
                    </span>
                    <span className="text-xs text-slate-500">Following</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold">
                      {user?.followers.length}
                    </span>
                    <span className="text-xs text-slate-500">Followers</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full mt-4 border-b border-gray-700">
                <div
                  className="relative flex justify-center flex-1 p-3 transition duration-300 cursor-pointer hover:bg-secondary"
                  onClick={() => setFeedType("posts")}
                >
                  Posts
                  {feedType === "posts" && (
                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <div
                  className="relative flex justify-center flex-1 p-3 transition duration-300 cursor-pointer text-slate-500 hover:bg-secondary"
                  onClick={() => setFeedType("likes")}
                >
                  Likes
                  {feedType === "likes" && (
                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            </>
          )}

          <Posts feedType={feedType} username={username} userId={user?._id} />
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
