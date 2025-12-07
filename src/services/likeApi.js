import apiClient from "./axios";

export default {
  likePost(postId) {
    return apiClient.post(`/likes/posts/${postId}`);
  },
};
