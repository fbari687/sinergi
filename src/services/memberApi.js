import apiClient from "./axios";
import apiCLient from "./axios";

export default {
  // 1. Ambil daftar member (Pagination + Search)
  getMembers(slug, search = "", page = 1) {
    return apiCLient.get(`/communities/${slug}/members`, {
      params: {
        q: search,
        page: page,
      },
    });
  },

  // 2. Kick Member (Kirim user_id via Body)
  kickMember(slug, userId) {
    const formData = new FormData();
    formData.append("user_id", userId);
    return apiCLient.post(`/communities/${slug}/members/kick`, formData);
  },

  // 3. Ubah Role (Kirim user_id & role via Body)
  changeRole(slug, userId, role) {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("role", role);
    return apiCLient.post(`/communities/${slug}/members/role`, formData);
  },

  getJoinRequests(slug) {
    return apiClient.get(`/communities/${slug}/requests`);
  },

  approveRequest(slug, userId) {
    const formData = new FormData();
    formData.append("user_id", userId);
    return apiClient.post(`/communities/${slug}/requests/approve`, formData);
  },

  declineRequest(slug, userId) {
    const formData = new FormData();
    formData.append("user_id", userId);
    return apiClient.post(`/communities/${slug}/requests/decline`, formData);
  },
};
