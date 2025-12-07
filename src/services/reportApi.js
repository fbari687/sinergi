import apiClient from "./axios";

export default {
  submitReport(formData) {
    return apiClient.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getSummary(params) {
    return apiClient.get("/admin/reports/summary", { params });
  },

  getDetail(type, id) {
    return apiClient.get(`/admin/reports/${type}/${id}`);
  },

  updateStatus(type, id, status) {
    const form = new FormData();
    form.append("status", status);
    return apiClient.post(`/admin/reports/${type}/${id}/status`, form);
  },

  deleteTarget(type, id) {
    return apiClient.post(`/admin/reports/${type}/${id}/delete-target`);
  },
};
