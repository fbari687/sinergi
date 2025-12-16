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
  requestForgotPasswordOtp(formData) {
    return apiClient.post("/forgot-password/request", formData);
  },

  // 2. Verifikasi OTP Lupa Password
  verifyForgotPasswordOtp(formData) {
    return apiClient.post("/forgot-password/verify", formData);
  },

  // 3. Reset Password Baru
  resetPassword(formData) {
    return apiClient.post("/forgot-password/reset", formData);
  },

  // [BARU] Request OTP Lifecycle
  // payload: { type: 'extend_student' | 'convert_alumni', new_email?: string }
  requestLifecycleOtp(payload) {
    return apiClient.post("/auth/lifecycle/request-otp", payload);
  },

  // [BARU] Verify OTP Lifecycle
  // payload: { type: '...', otp: string, new_email?: string }
  verifyLifecycleOtp(payload) {
    return apiClient.post("/auth/lifecycle/verify-otp", payload);
  },
};
