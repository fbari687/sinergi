import apiClient from "./axios";

export default {
  completeData(data) {
    return apiClient.post("/profile/complete-data", data);
  },
  getProfile(username) {
    return apiClient.get(`/profile/${username}`);
  },
  updateProfile(formData) {
    return apiClient.post("/users/profile/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
