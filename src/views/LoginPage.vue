<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/store/auth";
import { RouterLink, useRouter } from "vue-router";
import { Button, Message } from "primevue";
// Import Component Dialog (Pastikan path sesuai)
import ProfileCompletionDialog from "@/components/Profiles/ProfileCompletionDialog.vue";

const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const captcha_code = ref("");
const loading = ref(false);
const error = ref(null);
const showPassword = ref(false);

// State untuk Dialog Profile
const showProfileDialog = ref(false);

const captchaUrl = ref("");
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const refreshCaptcha = () => {
  captchaUrl.value = `${API_BASE_URL}/captcha?_t=${Date.now()}`;
};

onMounted(refreshCaptcha);

const login = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 1. Lakukan Login
    const userData = await authStore.handleLogin({
      email: email.value,
      password: password.value,
      captcha_code: captcha_code.value,
    });

    // --- LOGIKA BARU: LIFECYCLE CHECK ---
    const currentYear = new Date().getFullYear();

    // Cek jika Role Mahasiswa DAN Tahun sekarang > Tahun Perkiraan Lulus
    // Pastikan userData.tahun_perkiraan_lulus tersedia (konversi ke int jika string)
    if (userData.role === "Mahasiswa" && userData.tahun_perkiraan_lulus && currentYear > parseInt(userData.tahun_perkiraan_lulus)) {
      // Redirect ke halaman status akun
      router.push("/account-status");
      return; // Stop eksekusi agar tidak lanjut ke dashboard
    }
    // -------------------------------------

    // 2. Cek apakah Profile sudah lengkap (Logika Lama)
    if (userData && userData.is_profile_complete === false) {
      showProfileDialog.value = true;
    } else {
      router.push("/");
    }
  } catch (err) {
    error.value = err.response?.data?.meta?.message || "Gagal Login.";
    refreshCaptcha();
  } finally {
    loading.value = false;
  }
};

// Callback saat dialog sukses mengisi data
const onProfileCompleted = () => {
  showProfileDialog.value = false;
  router.push("/"); // Redirect ke Dashboard setelah data terisi
};
</script>

<template>
  <!-- Masukkan Dialog di root template -->
  <ProfileCompletionDialog :visible="showProfileDialog" @completed="onProfileCompleted" />

  <section class="h-screen w-screen overflow-hidden bg-white">
    <div class="flex flex-col md:flex-row h-full w-full">
      <!-- Panel Kiri (Visual) -->
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

      <!-- Panel Kanan (Form Login) -->
      <div class="w-full md:w-3/5 h-full flex justify-center items-center p-6 md:p-0">
        <div class="w-full max-w-sm md:max-w-none md:w-[350px] flex flex-col items-center">
          <h2 class="text-3xl font-bold text-gray-800 mb-6">LOGIN</h2>

          <form @submit.prevent="login" class="w-full flex flex-col">
            <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

            <input
              id="email"
              v-model="email"
              type="text"
              placeholder="email@domain.com"
              required
              class="mt-4 bg-gray-100 border-none h-11 px-4 mb-4 rounded-lg text-base font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div class="flex w-full items-center justify-between bg-gray-100 border-none h-11 pl-4 pr-2 mb-4 rounded-lg text-base focus-within:ring-2 focus-within:ring-blue-500">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" required class="focus:outline-none w-full bg-gray-100" />
              <button type="button" @click="showPassword = !showPassword" class="inset-y-0 flex items-center justify-center h-full w-10 text-gray-500 hover:text-gray-700 focus:outline-none" aria-label="Toggle password visibility">
                <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>

            <div class="mb-4 p-4 bg-gray-100 rounded-lg border border-gray-300 space-y-2">
              <label for="captcha" class="block text-sm font-medium text-gray-700"> Verifikasi Keamanan: </label>

              <div class="flex items-center gap-2">
                <div class="w-full bg-gray-200 rounded-md p-2 text-center border border-gray-300">
                  <img :src="captchaUrl" alt="captcha" crossorigin="use-credentials" class="h-[50px] w-full border rounded" />
                </div>
                <button type="button" @click="refreshCaptcha" class="shrink-0 bg-gray-600 hover:bg-gray-700 text-white border-none h-10 w-10 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-300">
                  <i class="fas fa-redo"></i>
                </button>
              </div>

              <!-- Input CAPTCHA -->
              <input
                type="text"
                v-model="captcha_code"
                id="captcha"
                placeholder="Masukkan 5 kode di atas"
                required
                maxlength="5"
                autocomplete="off"
                class="bg-white border border-gray-300 text-gray-900 h-10 px-4 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>

            <Button
              type="submit"
              label="Login"
              icon="pi pi-sign-in"
              class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6 transition-colors duration-300"
              :loading="loading"
            />
          </form>

          <RouterLink to="/forgotpassword" class="text-gray-600 text-sm mb-4 no-underline hover:underline"> Forgot Password? </RouterLink>

          <p class="text-sm text-gray-600">
            Belum punya akun?
            <RouterLink to="/register" class="text-gray-800 font-bold no-underline hover:underline"> Sign Up </RouterLink>
          </p>
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
