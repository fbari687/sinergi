import apiClient from "./axios";

export default {
  // Ambil list forum
  getForums(slug, search = "", page = 1) {
    return apiClient.get(`/communities/${slug}/forums`, {
      params: { q: search, page: page },
    });
  },

  // Ambil detail forum
  getForumDetail(slug, id) {
    return apiClient.get(`/communities/${slug}/forums/${id}`);
  },

  // Buat topik baru
  createForum(slug, forumData) {
    return apiClient.post(`/communities/${slug}/forums`, forumData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Ambil jawaban (responds)
  getResponds(slug, forumId) {
    return apiClient.get(`/communities/${slug}/forums/${forumId}/responds`);
  },

  // Kirim jawaban
  createRespond(slug, forumId, message, parentId = null) {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("parent_id", parentId);
    return apiClient.post(`/communities/${slug}/forums/${forumId}/responds`, formData);
  },

  // Tandai solusi (Mark Accepted)
  markAsAccepted(slug, forumId, respondId) {
    return apiClient.post(`/communities/${slug}/forums/${forumId}/responds/${respondId}/accept`);
  },
};
