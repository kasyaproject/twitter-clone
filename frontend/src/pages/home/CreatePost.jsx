import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [img, setImg] = useState(null);
  const imgRef = useRef(null);
  // const isError = false;

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async ({ content, img }) => {
      try {
        const res = await fetch("/api/post/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content, img }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Something went wron");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      setContent("");
      setImg(null);
      toast.success("Post created successfully");
      // Refetch untuk menrefresh data post
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPost({ content, img });
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-700">
      <div className="avatar">
        <div className="w-8 rounded-full">
          <img src={authUser.profileImg || "/avatar-placeholder.png"} />
        </div>
      </div>
      <form className="flex flex-col w-full gap-2" onSubmit={handleSubmit}>
        <textarea
          className="w-full p-0 text-lg border-gray-800 border-none resize-none textarea focus:outline-none"
          placeholder="What is happening?!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {img && (
          <div className="relative mx-auto w-72">
            <IoCloseSharp
              className="absolute top-0 right-0 w-5 h-5 text-white bg-gray-800 rounded-full cursor-pointer"
              onClick={() => {
                setImg(null);
                imgRef.current.value = null;
              }}
            />
            <img
              src={img}
              className="object-contain w-full mx-auto rounded h-72"
            />
          </div>
        )}

        <div className="flex justify-between py-2 border-t border-t-gray-700">
          <div className="flex items-center gap-1">
            <CiImageOn
              className="w-6 h-6 cursor-pointer fill-primary"
              onClick={() => imgRef.current.click()}
            />
            <BsEmojiSmileFill className="w-5 h-5 cursor-pointer fill-primary" />
          </div>
          <input type="file" hidden ref={imgRef} onChange={handleImgChange} />
          <button className="px-4 text-white rounded-full btn btn-primary btn-sm">
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
        {/* {isError && <div className="text-red-500">Something went wrong</div>} */}
      </form>
    </div>
  );
};
export default CreatePost;
