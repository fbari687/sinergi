import { defineStore } from "pinia";
import { ref } from "vue";
import authApi from "@/services/authApi";
import router from "@/router";

export const useAuthStore = defineStore("auth", () => {
  // --- STATE ---
  const user = ref(null);
  const pollingInterval = ref(null); // Variabel untuk menyimpan ID interval

  // --- ACTIONS ---

  /**
   * Set data pengguna setelah login berhasil
   */
  function setUser(userData) {
    user.value = userData;
  }

  /**
   * Helper: Update data notifikasi saja (tanpa reload page)
   * Dipanggil oleh interval polling
   */
  async function updateNotificationCount() {
    // Jika user tidak ada / logout, hentikan proses
    if (!user.value) return;

    try {
      // Kita panggil getMe lagi untuk cek data terbaru
      // Pastikan backend /me sudah mengembalikan 'unread_notifications_count'
      const response = await authApi.getMe();
      const newData = response.data.data;

      // Update hanya field count notifikasi agar reaktif
      if (user.value && newData.unread_notifications_count !== undefined) {
        user.value.unread_notifications_count = newData.unread_notifications_count;
      }
    } catch (error) {
      // Silent error: jangan ganggu user jika polling gagal sesekali
      console.warn("Polling notifikasi gagal:", error);
    }
  }

  /**
   * Mulai proses polling (Cek setiap 10 detik)
   */
  function startNotificationPolling() {
    // Jika sudah jalan, jangan ditumpuk
    if (pollingInterval.value) return;

    // Jalankan pertama kali segera (opsional)
    // updateNotificationCount();

    // Set interval 10 detik (10000ms)
    pollingInterval.value = setInterval(() => {
      updateNotificationCount();
    }, 10000);
  }

  /**
   * Hentikan proses polling (Penting saat logout/error)
   */
  function stopNotificationPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }
  }

  /**
   * Kurangi count notifikasi secara manual (Synchronous)
   * Dipanggil saat user mengklik notifikasi
   */
  function decrementNotificationCount() {
    if (user.value && user.value.unread_notifications_count > 0) {
      user.value.unread_notifications_count--;
    }
  }

  /**
   * Nol-kan notifikasi
   * Dipanggil saat "Tandai semua dibaca"
   */
  function resetNotificationCount() {
    if (user.value) {
      user.value.unread_notifications_count = 0;
    }
  }

  /**
   * Sinkronisasi paksa count dari angka spesifik
   * Berguna saat fetch halaman notifikasi
   */
  function syncNotificationCount(count) {
    if (user.value) {
      user.value.unread_notifications_count = count;
    }
  }

  /**
   * Coba ambil data pengguna dari sesi di backend
   * Ini penting untuk page refresh
   */
  async function checkAuth() {
    try {
      const response = await authApi.getMe();
      setUser(response.data.data);

      // Jika berhasil auth, JALANKAN polling
      startNotificationPolling();
    } catch (error) {
      user.value = null;
      // Jika gagal auth, MATIKAN polling
      stopNotificationPolling();
    }
  }

  /**
   * Proses login
   */
  async function handleLogin(credentials) {
    // Panggil API login
    const response = await authApi.login(credentials);

    // Simpan data user ke state
    setUser(response.data.data);

    // Login sukses, JALANKAN polling
    startNotificationPolling();

    // Arahkan ke halaman utama
    return response.data.data;
  }

  /**
   * Proses logout
   */
  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      // Reset state
      user.value = null;

      // Logout sukses, MATIKAN polling
      stopNotificationPolling();

      router.push("/login");
    }
  }

  return {
    user,
    setUser,
    checkAuth,
    handleLogin,
    handleLogout,
    // Export fungsi polling jika ingin dipanggil manual dari komponen lain (opsional)
    startNotificationPolling,
    stopNotificationPolling,
    decrementNotificationCount,
    resetNotificationCount,
    syncNotificationCount,
  };
});
