import apiClient from "./axios";

export default {
  // Ambil semua notifikasi & jumlah unread
  getAll() {
    return apiClient.get("/notifications");
  },

  // Tandai satu sebagai dibaca
  markAsRead(id) {
    return apiClient.post(`/notifications/${id}/markasread`);
  },

  // Tandai semua sebagai dibaca
  markAllRead() {
    return apiClient.post("/notifications/readall");
  },

  // Hapus notifikasi
  delete(id) {
    return apiClient.post(`/notifications/${id}/delete`);
  },
};
