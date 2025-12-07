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
      <div class="hidden md:block md:w-2/5 bg-blue-400">
        <!-- Konten animasi yang ada di file Anda sebelumnya bisa ditaruh di sini lagi jika mau -->
      </div>

      <div class="w-full md:w-3/5 h-full flex justify-center items-center p-6 md:p-0">
        <!-- Kontainer Form (Lebar dibatasi) -->
        <div v-if="step === 1" class="w-full max-w-sm md:w-[400px] flex flex-col items-center p-6 shadow-md rounded-lg">
          <h2 class="text-3xl font-bold text-gray-800 mb-6">SIGN UP</h2>

          <!-- Ganti action="verify-otp.html" sesuai alur registrasi Anda -->
          <form @submit.prevent="handleRegister" class="w-full flex flex-col">
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
            <input
              id="email"
              v-model="email"
              type="text"
              placeholder="email@domain.com"
              required
              class="mt-4 bg-gray-100 border-none h-11 px-4 mb-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input id="username" v-model="username" type="text" placeholder="Username" required class="bg-gray-100 border-none h-11 px-4 mb-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 mb-4 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" required class="focus:outline-none w-full bg-gray-100" />
              <button type="button" @click="showPassword = !showPassword" class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Toggle password visibility">
                <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 mb-4 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
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

<style scoped></style>
