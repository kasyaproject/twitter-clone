import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const btnFollow = () => {
  const queryClient = useQueryClient();

  const { mutate: follow, isPending } = useMutation({
    mutationFn: async (userId) => {
      try {
        const res = await fetch(`/api/users/follow/${userId}`, {
          method: "POST",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Something went wrong");

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggestedUser"] }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
      ]);
    },
    onError: (error) => {
      toast.error("Error following user: ", error.message);
    },
  });

  return { follow, isPending };
};

export default btnFollow;