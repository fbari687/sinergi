<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "primevue";
import authApi from "@/services/authApi";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const token = ref(null);
const password = ref("");
const passwordConfirmation = ref("");
const loading = ref(false);
const status = ref("form"); // 'form' | 'success' | 'error'
const message = ref("");

onMounted(() => {
  token.value = route.query.token || null;
  if (!token.value) {
    status.value = "error";
    message.value = "Token aktivasi tidak ditemukan. Pastikan Anda membuka link dari email yang benar.";
  }
});

const submit = async () => {
  if (!token.value) return;
  if (!password.value || password.value.length < 8) {
    toast.add({
      severity: "warn",
      summary: "Password terlalu pendek",
      detail: "Minimal 8 karakter.",
      life: 3000,
    });
    return;
  }
  if (password.value !== passwordConfirmation.value) {
    toast.add({
      severity: "warn",
      summary: "Konfirmasi tidak sesuai",
      detail: "Konfirmasi password harus sama.",
      life: 3000,
    });
    return;
  }

  loading.value = true;
  try {
    const res = await authApi.activateExternalAccount({
      token: token.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });

    status.value = "success";
    message.value = res.data?.meta?.message || "Akun berhasil diaktivasi. Silakan login menggunakan email dan password Anda.";
    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: message.value,
      life: 4000,
    });
  } catch (err) {
    status.value = "error";
    message.value = err.response?.data?.meta?.message || "Gagal mengaktifkan akun. Token mungkin tidak valid atau sudah kadaluarsa.";
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: message.value,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push({ name: "LoginPage" }); // sesuaikan dengan nama route login kamu
};
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white shadow-lg rounded-2xl p-6">
      <div class="mb-4 text-center">
        <h1 class="text-xl font-bold text-gray-900">Aktivasi Akun SINERGI</h1>
        <p class="text-sm text-gray-600 mt-1">Silakan buat password untuk akun Anda.</p>
      </div>

      <div v-if="status === 'error'" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
        {{ message }}
      </div>

      <form v-if="status !== 'success'" @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Password Baru</label>
          <input v-model="password" type="password" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Minimal 8 karakter" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password</label>
          <input v-model="passwordConfirmation" type="password" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" :disabled="loading" class="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed">
          <i v-if="loading" class="fas fa-spinner fa-spin text-xs"></i>
          <span>{{ loading ? "Memproses..." : "Aktifkan Akun" }}</span>
        </button>
      </form>

      <div v-else class="text-center mt-4">
        <div class="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500 mb-2">
          <i class="fas fa-check text-white"></i>
        </div>
        <p class="text-sm text-gray-700 mb-2">
          {{ message }}
        </p>
        <button @click="goToLogin" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Pergi ke Halaman Login</button>
      </div>
    </div>
  </div>
</template>
