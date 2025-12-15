<script setup>
import { ref, watch, onUnmounted } from "vue";
import authApi from "@/services/authApi";
import { Button, InputOtp, Message, useToast } from "primevue";
import { useRouter } from "vue-router";
import NumberFlow from "@number-flow/vue";

const toast = useToast();
const router = useRouter();

const loading = ref(false);
const error = ref(null);
const step = ref(1);

const email = ref("");
const username = ref("");
const password = ref("");
const showPassword = ref(false);
const retypepassword = ref("");
const showConfirmationPassword = ref(false);

const otp_code = ref("");

const timer = ref(60);
const isTimerActive = ref(false);
let timerInterval = null;

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
      // Timer selesai
      isTimerActive.value = false;
      clearTimer();
    }
  }, 1000);
};

const handleRegister = async () => {
  loading.value = true;
  error.value = null;
  try {
    if (password.value !== retypepassword.value) {
      error.value = "Password dan Konfirmasi Password tidak sama!";
      return;
    }
    const formData = new FormData();
    formData.append("username", username.value);
    formData.append("email", email.value);
    formData.append("password", password.value);

    await authApi.requestOtp(formData);

    step.value = 2;
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal meminta OTP.";
  } finally {
    loading.value = false;
  }
};

const handleResendOtp = async () => {
  loading.value = true;
  error.value = null;
  try {
    if (password.value !== retypepassword.value) {
      error.value = "Password dan Konfirmasi Password tidak sama!";
      return;
    }
    const formData = new FormData();
    formData.append("username", username.value);
    formData.append("email", email.value);
    formData.append("password", password.value);

    await authApi.requestOtp(formData);

    startTimer();
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal mengirim ulang OTP.";
  } finally {
    loading.value = false;
  }
};

const handleVerify = async () => {
  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("email", email.value);
    formData.append("otp_code", otp_code.value);

    await authApi.verifyOtp(formData);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Akun berhasil diregistrasi", life: 3000 });
    router.push("/login");
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal memverifikasi OTP.";
  } finally {
    loading.value = false;
  }
};

watch(step, (newStep) => {
  if (newStep === 2) {
    startTimer();
  }
});

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
              Selamat Datang di <br /><span class="underline">S</span>istem <span class="underline">In</span>teraksi <span class="underline">E</span>dukasi <span class="underline">R</span>iset <span class="underline">G</span>agasan dan
              <span class="underline">I</span>novasi
            </h1>
          </div>
        </div>
      </div>

      <div class="w-full md:w-3/5 h-full flex justify-center items-center p-6 md:p-0">
        <!-- Kontainer Form (Lebar dibatasi) -->
        <div v-if="step === 1" class="w-full max-w-sm md:w-[400px] flex flex-col items-center p-6 shadow-md rounded-lg">
          <h2 class="text-3xl font-bold text-gray-800 mb-6">SIGN UP</h2>

          <!-- Ganti action="verify-otp.html" sesuai alur registrasi Anda -->
          <form @submit.prevent="handleRegister" class="w-full flex flex-col">
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <div class="w-full flex flex-col mb-2">
              <input id="email" v-model="email" type="text" placeholder="email@domain.com" required class="mt-4 bg-gray-100 border-none h-11 px-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <small class="text-xs text-red-500">*Gunakan email PNJ</small>
            </div>
            <input id="username" v-model="username" type="text" placeholder="Username" required class="bg-gray-100 border-none h-11 px-4 mb-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="w-full flex flex-col mb-2">
              <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
                <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" required class="focus:outline-none w-full bg-gray-100" />
                <button type="button" @click="showPassword = !showPassword" class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Toggle password visibility">
                  <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <small class="text-xs text-red-500">*Minimal 8 Karakter</small>
            </div>
            <div class="w-full flex flex-col mb-2">
              <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
                <input id="retypepassword" v-model="retypepassword" :type="showConfirmationPassword ? 'text' : 'password'" placeholder="Confirmation Password" required class="focus:outline-none w-full bg-gray-100" />
                <button
                  type="button"
                  @click="showConfirmationPassword = !showConfirmationPassword"
                  class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  <i class="fas" :class="showConfirmationPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
              <small class="text-xs text-red-500">*Samakan dengan Password</small>
            </div>
            <Button
              type="submit"
              label="Sign Up"
              icon="pi pi-sign-in"
              class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6 transition-colors duration-300"
              :loading="loading"
            />
          </form>

          <!-- Link kembali ke Login -->
          <p class="text-sm text-gray-600">
            Sudah Punya Akun?
            <RouterLink to="/login" class="text-gray-800 font-bold no-underline hover:underline"> Login </RouterLink>
          </p>
        </div>
        <div v-if="step === 2" class="bg-white p-8 md:p-10 rounded-lg shadow-md w-full max-w-sm">
          <h2 class="text-2xl font-bold text-gray-800 mb-2 text-left">Masukan 6 Digit OTP</h2>
          <p class="text-gray-600 text-sm mb-6 text-left">
            Kami mengirimkan kode ke <span class="font-medium text-gray-700">{{ email }}</span>
            <!-- Ganti user@example.com dengan email asli dari halaman sebelumnya -->
          </p>

          <form @submit.prevent="handleVerify" class="w-full flex flex-col items-center">
            <!-- OTP Input Boxes -->
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <div class="flex justify-center gap-2 mb-6 w-full" id="otp-container">
              <InputOtp v-model="otp_code" :length="6" integerOnly size="large" />
            </div>

            <!-- Tombol Verify -->
            <Button type="submit" label="Verify" class="w-full bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6 transition-colors duration-300" :loading="loading" />
          </form>

          <!-- Link Resend Code -->
          <div class="text-center text-sm">
            <span class="text-gray-600">Tidak dapat kode?</span>
            <span v-if="isTimerActive" class="text-gray-600"> Kirim ulang kode dalam <NumberFlow :value="timer" /> detik </span>
            <button v-else type="button" @click.prevent="handleResendOtp" class="cursor-pointer text-blue-600 no-underline hover:underline font-medium ml-1">Kirim ulang</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
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

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
  }
}

.animate-slide-in {
  animation: slideInFromRight 0.8s ease-out forwards;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-400 {
  animation-delay: 0.4s;
}
</style>
