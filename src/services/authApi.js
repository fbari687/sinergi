import apiClient from "@/services/axios";

export default {
  login(credentials) {
    const formData = new FormData();
    formData.append("email", credentials.email);
    formData.append("password", credentials.password);
    formData.append("captcha_code", credentials.captcha_code);
    return apiClient.post("/login", formData);
  },
  logout() {
    return apiClient.post("/logout");
  },
  getMe() {
    return apiClient.get("/me");
  },
  requestOtp(userData) {
    return apiClient.post("/register/request", userData);
  },
  verifyOtp(otpData) {
    return apiClient.post("/register/verify", otpData);
  },
  activateExternalAccount(payload) {
    return apiClient.post("/activate-account", payload);
  },
};
