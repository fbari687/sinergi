<script setup>
import { ref, watch, onUnmounted } from "vue";
import authApi from "@/services/authApi";
import { Button, InputOtp, Message, useToast } from "primevue";
import { useRouter } from "vue-router";
import NumberFlow from "@number-flow/vue";

const toast = useToast();
const router = useRouter();

// State UI
const loading = ref(false);
const error = ref(null);
const step = ref(1); // 1: Input Email, 2: Verify OTP, 3: New Password

// State Data
const email = ref("");
const otp_code = ref("");
const password = ref("");
const retypepassword = ref("");

// State Toggles
const showPassword = ref(false);
const showConfirmationPassword = ref(false);

// State Timer
const timer = ref(60);
const isTimerActive = ref(false);
let timerInterval = null;

// --- TIMER LOGIC (Sama seperti Register) ---
const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const startTimer = () => {
  clearTimer();
  timer.value = 60;
  isTimerActive.value = true;

  timerInterval = setInterval(() => {
    if (timer.value > 0) {
      timer.value--;
    } else {
      isTimerActive.value = false;
      clearTimer();
    }
  }, 1000);
};

// --- STEP 1: REQUEST OTP ---
const handleRequestOtp = async () => {
  if (!email.value) {
    error.value = "Email wajib diisi.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("email", email.value);

    await authApi.requestForgotPasswordOtp(formData);

    // Jika sukses, pindah ke step 2 & nyalakan timer
    step.value = 2;
    startTimer();
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal mengirim OTP. Pastikan email terdaftar.";
  } finally {
    loading.value = false;
  }
};

// --- STEP 2: VERIFY OTP ---
const handleVerifyOtp = async () => {
  if (!otp_code.value || otp_code.value.length < 6) {
    error.value = "Masukkan 6 digit kode OTP.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    // Backend butuh otp_code saja karena session sudah simpan email,
    // tapi controller verifyForgotPasswordOtp Anda juga membaca $_SESSION['forgot_password_email'].
    // Namun untuk keamanan/konsistensi frontend, kita kirim apa yang diminta.
    formData.append("otp_code", otp_code.value);

    await authApi.verifyForgotPasswordOtp(formData);

    // Jika sukses, pindah ke step 3 (Reset Password)
    step.value = 3;
    // Stop timer karena OTP sudah verified
    clearTimer();
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Kode OTP salah atau kadaluarsa.";
  } finally {
    loading.value = false;
  }
};

// --- RESEND OTP ---
const handleResendOtp = async () => {
  loading.value = true;
  error.value = null;
  try {
    const formData = new FormData();
    formData.append("email", email.value);

    await authApi.requestForgotPasswordOtp(formData);
    startTimer();
    toast.add({ severity: "info", summary: "Terkirim", detail: "Kode OTP baru telah dikirim.", life: 3000 });
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal mengirim ulang OTP.";
  } finally {
    loading.value = false;
  }
};

// --- STEP 3: RESET PASSWORD ---
const handleResetPassword = async () => {
  loading.value = true;
  error.value = null;

  try {
    if (password.value.length < 8) {
      error.value = "Password minimal 8 karakter.";
      return;
    }
    if (password.value !== retypepassword.value) {
      error.value = "Password dan Konfirmasi Password tidak sama!";
      return;
    }

    const formData = new FormData();
    formData.append("new_password", password.value);
    formData.append("confirm_password", retypepassword.value);

    await authApi.resetPassword(formData);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Password berhasil diubah. Silakan login.", life: 3000 });
    router.push("/login");
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal mengubah password.";
  } finally {
    loading.value = false;
  }
};

// Cleanup timer saat leave component
onUnmounted(() => {
  clearTimer();
});
</script>

<template>
  <section class="h-screen w-screen overflow-hidden bg-white">
    <div class="flex flex-col md:flex-row h-full w-full">
      <div class="hidden md:flex md:w-2/5 bg-linear-to-br from-purple-600 via-blue-500 to-cyan-400 relative overflow-hidden">
        <div class="absolute inset-0 bg-black opacity-10"></div>
        <div class="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full translate-x-1/2 translate-y-1/2"></div>

        <div class="relative z-10 w-full flex flex-col justify-center items-start px-12">
          <div class="animate-slide-in opacity-0 mb-6">
            <RouterLink to="/">
              <img src="/logo_sinergi_white.png" alt="Sinergi Logo" class="h-16 mb-4" />
            </RouterLink>
          </div>

          <div class="animate-slide-in opacity-0 delay-100 mb-8">
            <img src="/landingpage.png" alt="Collaboration Illustration" class="max-w-calc[100%] h-auto" />
          </div>

          <div class="animate-slide-in opacity-0 delay-200">
            <h1 class="text-4xl text-white font-bold mb-4 leading-tight">
              Pemulihan Akun <br />
              <span class="text-2xl font-normal">Kembalikan akses ke akun SINERGI Anda.</span>
            </h1>
          </div>
        </div>
      </div>

      <div class="w-full md:w-3/5 h-full flex justify-center items-center p-6 md:p-0">
        <div v-if="step === 1" class="w-full max-w-sm md:w-[400px] flex flex-col items-center p-6 shadow-md rounded-lg bg-white">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">Lupa Password?</h2>
          <p class="text-gray-500 text-sm mb-6 text-center">Masukkan email yang terdaftar untuk menerima kode OTP.</p>

          <form @submit.prevent="handleRequestOtp" class="w-full flex flex-col">
            <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

            <div class="w-full flex flex-col mb-4">
              <input id="email" v-model="email" type="text" placeholder="email@domain.com" required class="bg-gray-100 border-none h-11 px-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <Button
              type="submit"
              label="Kirim Kode OTP"
              icon="pi pi-send"
              class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6 transition-colors duration-300"
              :loading="loading"
            />
          </form>

          <p class="text-sm text-gray-600">
            Kembali ke
            <RouterLink to="/login" class="text-gray-800 font-bold no-underline hover:underline"> Login </RouterLink>
          </p>
        </div>

        <div v-if="step === 2" class="w-full max-w-sm md:w-[400px] flex flex-col items-center p-6 shadow-md rounded-lg bg-white">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Verifikasi OTP</h2>
          <p class="text-gray-600 text-sm mb-6 text-center">
            Kode dikirim ke <span class="font-medium text-gray-900">{{ email }}</span>
          </p>

          <form @submit.prevent="handleVerifyOtp" class="w-full flex flex-col items-center">
            <Message v-if="error" severity="error" :closable="false" class="mb-4 w-full">{{ error }}</Message>

            <div class="flex justify-center gap-2 mb-6 w-full">
              <InputOtp v-model="otp_code" :length="6" integerOnly size="large" />
            </div>

            <Button type="submit" label="Verifikasi" class="w-full bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6" :loading="loading" />
          </form>

          <div class="text-center text-sm">
            <span class="text-gray-600">Tidak menerima kode?</span>
            <span v-if="isTimerActive" class="text-gray-600 ml-1"> Kirim ulang dalam <NumberFlow :value="timer" /> detik </span>
            <button v-else type="button" @click.prevent="handleResendOtp" class="cursor-pointer text-blue-600 no-underline hover:underline font-medium ml-1">Kirim ulang</button>
          </div>

          <button @click="step = 1" class="mt-4 text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer">Ganti Email</button>
        </div>

        <div v-if="step === 3" class="w-full max-w-sm md:w-[400px] flex flex-col items-center p-6 shadow-md rounded-lg bg-white">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
          <p class="text-gray-500 text-sm mb-6 text-center">Silakan buat password baru Anda.</p>

          <form @submit.prevent="handleResetPassword" class="w-full flex flex-col">
            <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

            <div class="w-full flex flex-col mb-4">
              <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password Baru" required class="focus:outline-none w-full bg-gray-100" />
                <button type="button" @click="showPassword = !showPassword" class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none">
                  <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <small class="text-xs text-gray-400 mt-1 ml-1">*Minimal 8 Karakter</small>
            </div>

            <div class="w-full flex flex-col mb-6">
              <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
                <input v-model="retypepassword" :type="showConfirmationPassword ? 'text' : 'password'" placeholder="Konfirmasi Password" required class="focus:outline-none w-full bg-gray-100" />
                <button type="button" @click="showConfirmationPassword = !showConfirmationPassword" class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none">
                  <i class="fas" :class="showConfirmationPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              label="Simpan Password"
              icon="pi pi-check"
              class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer transition-colors duration-300"
              :loading="loading"
            />
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Reuse animasi yang sama dari RegisterPage agar konsisten */
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slideInFromRight 0.8s ease-out forwards;
}

.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
</style>
