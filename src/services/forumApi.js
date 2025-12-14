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
  createRespond(slug, forumId, formData) {
    return apiClient.post(`/communities/${slug}/forums/${forumId}/responds`, formData);
  },

  // Tandai solusi (Mark Accepted)
  markAsAccepted(slug, forumId, respondId) {
    return apiClient.post(`/communities/${slug}/forums/${forumId}/responds/${respondId}/accept`);
  },

  // Vote Topik Forum (Pertanyaan Utama)
  // Endpoint: POST api/reactions/forums/{forumId}
  voteForum(forumId, reactionValue) {
    // reactionValue: 1 (up), -1 (down)
    // Controller membaca $_POST['reaction'], axios otomatis mengirim JSON.
    // Jika backend Anda tidak otomatis mengubah JSON ke $_POST, Anda mungkin perlu format form-data.
    // Asumsi: Backend Anda bisa baca JSON body atau Anda menggunakan header form-urlencoded.
    return apiClient.post(
      `/reactions/forums/${forumId}`,
      {
        reaction: reactionValue,
      },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Jaga-jaga agar terbaca $_POST murni
      }
    );
  },

  // Vote Jawaban (Respond)
  // Endpoint: POST api/reactions/forumrespond/{forumRespondId}
  voteAnswer(respondId, reactionValue) {
    return apiClient.post(
      `/reactions/forumrespond/${respondId}`,
      {
        reaction: reactionValue,
      },
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );
  },
};
