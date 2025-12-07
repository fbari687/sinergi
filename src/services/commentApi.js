import apiClient from "./axios";

export default {
  createComment(commentData, postId) {
    return apiClient.post(`/posts/${postId}/comments`, commentData);
  },
  replyComment(commentData, commentId) {
    return apiClient.post(`/comments/${commentId}/replies`, commentData);
  },
  getCommentsByPostId(postId) {
    return apiClient.get(`/posts/${postId}/comments`);
  },
  getReplies(commentId) {
    return apiClient.get(`/comments/${commentId}/replies`);
  },
  deleteComment(commentId) {
    return apiClient.post(`/comments/${commentId}/delete`);
  },
};
