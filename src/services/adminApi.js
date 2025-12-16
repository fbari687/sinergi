import apiClient from "./axios";

export default {
  // Dashboard overview
  getDashboardOverview(period, type) {
    return apiClient.get("/admin/dashboard/overview", {
      params: {
        period: period,
        type: type,
      },
    });
  },

  getGlobalLeaderboard(period) {
    return apiClient.get("/admin/leaderboard", {
      params: { period },
    });
  },

  // Ambil daftar request (bisa filter by status)
  getAccountRequests(params) {
    return apiClient.get("/admin/account-requests", { params });
  },

  // Setujui Request -> Buat Akun User
  approveAccountRequest(requestId) {
    return apiClient.post(`/admin/account-requests/${requestId}/approve`);
  },

  // Tolak Request
  rejectAccountRequest(requestId, reason) {
    return apiClient.post(`/admin/account-requests/${requestId}/reject`, { reason });
  },

  createUser(formData) {
    // formData is FormData
    return apiClient.post("/admin/users", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getUsers(params) {
    // params: { page, per_page, role, q, sort_by, sort_dir }
    return apiClient.get("/admin/users", { params });
  },

  // updateUserRole(id, role) {
  //   const form = new FormData();
  //   form.append("role", role);
  //   return apiClient.post(`/admin/users/${id}/role`, form);
  // },

  updateUser(id, formData) {
    // Pastikan backend support method POST dengan _method=PUT atau langsung POST untuk update multipart
    return apiClient.post(`/admin/users/${id}/update`, formData);
  },

  toggleActiveUser(id) {
    return apiClient.post(`/admin/users/${id}/toggle-active`);
  },

  deleteUser(id) {
    return apiClient.post(`/admin/users/${id}/delete`);
  },

  promoteToAlumni(payload) {
    // payload: { user_ids: [1,2,3], use_estimated: true/false, tahun_lulus: 2025 (optional) }
    return apiClient.post("/admin/users/promote-to-alumni", payload);
  },
};
