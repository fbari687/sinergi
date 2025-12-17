import apiClient from "./axios";

export default {
  getAllPostHome(page = 1, search = "") {
    return apiClient.get("/posts", {
      params: { page: page, search: search },
    });
  },
  getAllPostCommunities(slug, page = 1, search = "") {
    return apiClient.get(`/posts/communities/${slug}`, {
      params: { page: page, search: search },
    });
  },
  getPostById(postId) {
    return apiClient.get(`/posts/${postId}`);
  },
  createPostHome(postData) {
    return apiClient.post("/posts", postData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  createPostCommunities(postData, slug) {
    return apiClient.post(`/posts/communities/${slug}`, postData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updatePost(postId, formData) {
    // Backend menggunakan POST untuk update (sesuai route yang Anda berikan)
    return apiClient.post(`/posts/${postId}/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  togglePostPin(postId) {
    return apiClient.post(`/posts/${postId}/pin`);
  },
  deletePost(postId) {
    return apiClient.post(`/posts/${postId}/delete`);
  },
};
