<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import { useToast } from "primevue";
import InputOtp from "primevue/inputotp";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import authApi from "@/services/authApi";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const user = computed(() => authStore.user);

const step = ref("selection");
const loading = ref(false); // Global loading state untuk halaman ini
const errorMsg = ref("");

const otpCode = ref("");
const personalEmail = ref("");

// --- FLOW A: MASIH MAHASISWA ---
const startStudentFlow = async () => {
  if (loading.value) return; // Prevent double click
  loading.value = true;
  errorMsg.value = ""; // Clear previous errors
  try {
    await authApi.requestLifecycleOtp({ type: "extend_student" });
    step.value = "verify_student";
    toast.add({ severity: "info", summary: "OTP Terkirim", detail: "Cek email kampus Anda.", life: 3000 });
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal kirim OTP" });
  } finally {
    loading.value = false;
  }
};

// ... (verifyStudentOtp tetap sama) ...
const verifyStudentOtp = async () => {
  loading.value = true;
  try {
    await authApi.verifyLifecycleOtp({ type: "extend_student", otp: otpCode.value });
    toast.add({ severity: "success", summary: "Berhasil", detail: "Status mahasiswa diperpanjang.", life: 3000 });
    await authStore.checkAuth();
    router.push("/");
  } catch (err) {
    errorMsg.value = err.response?.data?.meta?.message || "OTP Salah.";
  } finally {
    loading.value = false;
  }
};

// --- FLOW B: SUDAH LULUS (ALUMNI) ---
const startAlumniFlow = () => {
  if (loading.value) return; // Prevent click saat loading
  step.value = "input_alumni_email";
};

// ... (requestAlumniOtp tetap sama) ...
const requestAlumniOtp = async () => {
  if (!personalEmail.value.includes("@") || personalEmail.value.endsWith("pnj.ac.id")) {
    errorMsg.value = "Mohon gunakan email pribadi (Gmail/Yahoo, dll).";
    return;
  }
  loading.value = true;
  errorMsg.value = "";
  try {
    await authApi.requestLifecycleOtp({ type: "convert_alumni", new_email: personalEmail.value });
    step.value = "verify_alumni";
    toast.add({ severity: "info", summary: "OTP Terkirim", detail: `Cek email ${personalEmail.value}`, life: 3000 });
  } catch (err) {
    errorMsg.value = err.response?.data?.meta?.message || "Gagal kirim OTP";
  } finally {
    loading.value = false;
  }
};

// ... (verifyAlumniOtp tetap sama) ...
const verifyAlumniOtp = async () => {
  loading.value = true;
  try {
    await authApi.verifyLifecycleOtp({ type: "convert_alumni", otp: otpCode.value, new_email: personalEmail.value });
    toast.add({ severity: "success", summary: "Selamat!", detail: "Akun berhasil diubah menjadi Alumni. Silakan login ulang.", life: 5000 });
    await authStore.handleLogout();
    router.push("/login");
  } catch (err) {
    errorMsg.value = err.response?.data?.meta?.message || "OTP Salah.";
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  if (loading.value) return;
  await authStore.handleLogout();
};

const backToSelection = () => {
  if (loading.value) return;
  step.value = "selection";
  otpCode.value = "";
  errorMsg.value = "";
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative">
      <div class="bg-blue-600 p-6 text-center">
        <h2 class="text-2xl font-bold text-white mb-2">Konfirmasi Status Akademik</h2>
        <p class="text-blue-100 text-sm">Halo, {{ user?.fullname }}. Sistem mendeteksi Anda telah melewati estimasi tahun lulus ({{ user?.tahun_perkiraan_lulus }}).</p>
      </div>

      <div class="p-8">
        <div v-if="step === 'selection'" class="flex flex-col gap-4 animate-fade-in">
          <p class="text-center text-gray-700 font-medium mb-4">Apakah Anda masih berstatus Mahasiswa Aktif?</p>

          <button
            @click="startStudentFlow"
            :disabled="loading"
            class="group relative flex items-center p-4 border-2 rounded-xl transition-all text-left w-full"
            :class="loading ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70' : 'border-green-100 hover:border-green-500 hover:bg-green-50 cursor-pointer'"
          >
            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-transform" :class="loading ? 'bg-gray-200 text-gray-400' : 'bg-green-100 text-green-600 group-hover:scale-110'">
              <i v-if="loading" class="fas fa-circle-notch fa-spin text-xl"></i>
              <i v-else class="fas fa-user-graduate text-xl"></i>
            </div>

            <div>
              <h3 class="font-bold text-gray-800">
                {{ loading ? "Memproses Permintaan..." : "Ya, Masih Mahasiswa" }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ loading ? "Mohon tunggu sebentar." : "Perpanjang masa studi 1 tahun." }}
              </p>
            </div>

            <i v-if="!loading" class="fas fa-chevron-right ml-auto text-gray-300 group-hover:text-green-500"></i>
          </button>

          <button
            @click="startAlumniFlow"
            :disabled="loading"
            class="group relative flex items-center p-4 border-2 rounded-xl transition-all text-left w-full"
            :class="loading ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50 grayscale' : 'border-blue-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'"
          >
            <div class="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <i class="fas fa-briefcase text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">Tidak, Sudah Lulus</h3>
              <p class="text-xs text-gray-500">Ubah akun menjadi Alumni.</p>
            </div>
            <i class="fas fa-chevron-right ml-auto text-gray-300 group-hover:text-blue-500"></i>
          </button>

          <button
            @click="handleLogout"
            :disabled="loading"
            class="group relative flex items-center p-4 border-2 rounded-xl transition-all text-left w-full"
            :class="loading ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50 grayscale' : 'border-red-100 hover:border-red-500 hover:bg-red-50 cursor-pointer'"
          >
            <div class="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
              <i class="fas fa-sign-out-alt text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-800">Kembali / Logout</h3>
            </div>
            <i class="fas fa-chevron-left ml-auto text-gray-300 group-hover:text-red-500"></i>
          </button>
        </div>

        <div v-if="step === 'verify_student'" class="flex flex-col items-center animate-fade-in">
          <div class="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 w-full text-center">
            <i class="fas fa-envelope mr-2"></i> OTP telah dikirim ke <b>{{ user?.email }}</b>
          </div>
          <label class="mb-2 text-sm font-bold text-gray-700">Masukkan Kode OTP</label>
          <InputOtp v-model="otpCode" :length="6" integerOnly :disabled="loading" />
          <Message v-if="errorMsg" severity="error" class="mt-4 w-full">{{ errorMsg }}</Message>
          <div class="flex gap-3 mt-8 w-full">
            <Button label="Kembali" severity="secondary" text class="w-1/2" @click="backToSelection" :disabled="loading" />
            <Button label="Verifikasi" class="w-1/2 bg-green-600 hover:bg-green-700 border-none" :loading="loading" @click="verifyStudentOtp" />
          </div>
        </div>

        <div v-if="step === 'input_alumni_email'" class="animate-fade-in">
          <div class="mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-2">Masukkan Email Pribadi</label>
            <InputText v-model="personalEmail" placeholder="contoh: nama@gmail.com" class="w-full" :disabled="loading" />
            <p class="text-xs text-gray-500 mt-2">Email kampus akan digantikan dengan email ini.</p>
          </div>
          <Message v-if="errorMsg" severity="error" class="mb-4">{{ errorMsg }}</Message>
          <div class="flex gap-3 mt-4 w-full">
            <Button label="Kembali" severity="secondary" text class="w-1/2" @click="backToSelection" :disabled="loading" />
            <Button label="Kirim OTP" class="w-1/2 bg-blue-600 hover:bg-blue-700 border-none" :loading="loading" @click="requestAlumniOtp" />
          </div>
        </div>

        <div v-if="step === 'verify_alumni'" class="flex flex-col items-center animate-fade-in">
          <div class="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm mb-6 w-full text-center">
            <i class="fas fa-envelope mr-2"></i> OTP dikirim ke <b>{{ personalEmail }}</b>
          </div>
          <label class="mb-2 text-sm font-bold text-gray-700">Masukkan Kode OTP</label>
          <InputOtp v-model="otpCode" :length="6" integerOnly :disabled="loading" />
          <Message v-if="errorMsg" severity="error" class="mt-4 w-full">{{ errorMsg }}</Message>
          <div class="flex gap-3 mt-8 w-full">
            <Button label="Ganti Email" severity="secondary" text class="w-1/2" @click="step = 'input_alumni_email'" :disabled="loading" />
            <Button label="Konfirmasi & Logout" class="w-1/2 bg-blue-600 hover:bg-blue-700 border-none" :loading="loading" @click="verifyAlumniOtp" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Utility class untuk grayscale efek disabled */
.grayscale {
  filter: grayscale(100%);
}
</style>
