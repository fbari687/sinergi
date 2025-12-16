<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import profileApi from "@/services/profileApi";
// TAMBAHAN: Import Menu dan useConfirm
import { useToast, useConfirm, Dialog, Button, Textarea, InputText } from "primevue";
import Menu from "primevue/menu";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
// TAMBAHAN: Inisialisasi Confirm
const confirm = useConfirm();

const userProfile = ref(null);
const loading = ref(true);

// --- STATE EDIT PROFILE ---
const showEditDialog = ref(false);
const editForm = ref({
  username: "",
  bio: "",
});
const selectedFile = ref(null);
const filePreview = ref(null);
const updating = ref(false);

// --- STATE MENU SETTINGS (MOBILE) ---
const settingsMenu = ref(null);
const menuItems = ref([
  {
    label: "Pengaturan Akun",
    items: [
      {
        label: "Edit Profil",
        icon: "pi pi-user-edit",
        command: () => {
          openEditDialog();
        },
      },
    ],
  },
  {
    separator: true,
  },
  {
    label: "Keluar",
    icon: "pi pi-sign-out",
    class: "text-red-600 font-bold",
    command: () => {
      handleLogoutConfirm();
    },
  },
]);

// Helper Toggle Menu
const toggleSettingsMenu = (event) => {
  settingsMenu.value.toggle(event);
};

// Helper Logout
const handleLogoutConfirm = () => {
  confirm.require({
    message: "Apakah Anda yakin ingin keluar?",
    header: "Konfirmasi Keluar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Ya, Keluar",
    rejectLabel: "Batal",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      await authStore.handleLogout();
    },
  });
};

// Cek apakah profil yang dibuka adalah milik user yang sedang login
const isMe = computed(() => {
  return authStore.user && userProfile.value && authStore.user.username === userProfile.value.username;
});

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { year: "numeric", month: "long" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
};

const fetchProfile = async () => {
  loading.value = true;
  const username = route.params.username;

  try {
    const res = await profileApi.getProfile(username);
    userProfile.value = res.data.data;
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Error", detail: "Pengguna tidak ditemukan", life: 3000 });
  } finally {
    loading.value = false;
  }
};

// --- LOGIKA EDIT PROFILE ---
// 1. Buka Dialog & Isi Data Awal
const openEditDialog = () => {
  if (!userProfile.value) return;

  editForm.value.username = userProfile.value.username;
  editForm.value.bio = userProfile.value.bio || "";

  // Reset gambar
  selectedFile.value = null;
  filePreview.value = userProfile.value.profile_picture;

  showEditDialog.value = true;
};

// 2. Handle Ganti File Gambar
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// 3. Submit Update
const handleUpdateProfile = async () => {
  updating.value = true;
  try {
    const formData = new FormData();
    formData.append("username", editForm.value.username);
    formData.append("bio", editForm.value.bio);

    if (selectedFile.value) {
      formData.append("profile_picture", selectedFile.value);
    }

    const res = await profileApi.updateProfile(formData);
    const updatedData = res.data.data;

    toast.add({ severity: "success", summary: "Berhasil", detail: "Profil berhasil diperbarui", life: 3000 });

    authStore.user = {
      ...authStore.user,
      username: updatedData.username,
      bio: updatedData.bio,
      profile_picture: updatedData.profile_picture_url || authStore.user.profile_picture,
    };

    localStorage.setItem("user_data", JSON.stringify(authStore.user));
    showEditDialog.value = false;

    if (route.params.username !== updatedData.username) {
      router.replace(`/profile/${updatedData.username}`);
    } else {
      await fetchProfile();
    }
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.meta?.message || "Gagal memperbarui profil";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  } finally {
    updating.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});

watch(
  () => route.params.username,
  (newVal) => {
    if (newVal) fetchProfile();
  }
);
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <div class="w-full">
      <div v-if="userProfile" class="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 class="font-bold text-lg text-gray-800 truncate">@{{ userProfile.username }}</h1>

        <div v-if="isMe" class="flex flex-col">
          <button @click="toggleSettingsMenu" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600">
            <i class="pi pi-cog text-xl"></i>
          </button>
          <Menu ref="settingsMenu" :model="menuItems" :popup="true" />
        </div>
      </div>
      <main class="w-full pt-4 md:pt-0 md:mt-20">
        <div v-if="loading" class="max-w-5xl mx-auto flex justify-center py-20">
          <i class="fas fa-circle-notch fa-spin text-4xl text-blue-500"></i>
        </div>

        <div v-else-if="userProfile" class="max-w-5xl mx-auto px-4 md:px-0">
          <div class="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6 border border-gray-100">
            <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div class="shrink-0">
                <img
                  :src="userProfile.profile_picture || `https://ui-avatars.com/api/?name=${userProfile.fullname}&background=random`"
                  alt="Foto Profil"
                  class="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                />
              </div>

              <div class="flex-1 text-center md:text-left w-full">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div>
                    <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                      {{ userProfile.fullname }}
                      <i v-if="userProfile.role === 'Dosen'" class="fas fa-check-circle text-blue-500 text-lg" title="Terverifikasi"></i>
                    </h1>
                    <p class="text-gray-500 text-lg">@{{ userProfile.username }}</p>
                  </div>

                  <div class="mt-4 sm:mt-0 gap-2 justify-center sm:justify-end hidden md:flex">
                    <button
                      v-if="isMe"
                      @click="openEditDialog"
                      class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer border-none"
                    >
                      <i class="fas fa-pen"></i> Edit Profil
                    </button>
                  </div>
                </div>

                <p class="text-gray-700 leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0 whitespace-pre-wrap">
                  {{ userProfile.bio || "Pengguna ini belum menulis bio." }}
                </p>

                <div class="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span class="flex items-center gap-2 px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
                    <i class="fas fa-user-tag text-blue-500"></i>
                    <span class="font-semibold">{{ userProfile.role }}</span>
                  </span>
                  <span class="flex items-center gap-2 px-2 py-1">
                    <i class="fas fa-calendar-alt text-gray-400"></i>
                    Bergabung {{ formatDate(userProfile.created_at) }}
                  </span>
                </div>

                <div v-if="userProfile.details" class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 border-t pt-4 border-dashed border-gray-200">
                  <template v-if="userProfile.role === 'Mahasiswa'">
                    <div class="flex items-center gap-3">
                      <i class="fas fa-id-card text-gray-400 w-5"></i
                      ><span
                        >NIM: <b>{{ userProfile.details.nim }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-graduation-cap text-gray-400 w-5"></i
                      ><span
                        >Prodi: <b>{{ userProfile.details.prodi }}</b></span
                      >
                    </div>
                  </template>
                  <template v-else-if="userProfile.role === 'Dosen'">
                    <div class="flex items-center gap-3">
                      <i class="fas fa-id-card text-gray-400 w-5"></i
                      ><span
                        >NIDN: <b>{{ userProfile.details.nidn }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-graduation-cap text-gray-400 w-5"></i
                      ><span
                        >Bidang Keahlian: <b>{{ userProfile.details.bidang_keahlian }}</b></span
                      >
                    </div>
                  </template>
                  <template v-else-if="userProfile.role === 'Mitra'">
                    <div class="flex items-center gap-3">
                      <i class="fas fa-building-user text-gray-400 w-5"></i
                      ><span
                        >Perusahaan: <b>{{ userProfile.details.nama_perusahaan }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-user-tie text-gray-400 w-5"></i
                      ><span
                        >Jabatan: <b>{{ userProfile.details.jabatan }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-location-dot text-gray-400 w-5"></i
                      ><span
                        >Alamat: <b>{{ userProfile.details.alamat_perusahaan }}</b></span
                      >
                    </div>
                  </template>
                  <template v-else-if="userProfile.role === 'Alumni'">
                    <div class="flex items-center gap-3">
                      <i class="fas fa-graduation-cap text-gray-400 w-5"></i
                      ><span
                        >Lulus: <b>{{ userProfile.details.tahun_lulus }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-user-tie text-gray-400 w-5"></i
                      ><span
                        >Pekerjaan: <b>{{ userProfile.details.pekerjaan_saat_ini }}</b></span
                      >
                    </div>
                    <div class="flex items-center gap-3">
                      <i class="fas fa-building-user text-gray-400 w-5"></i
                      ><span
                        >Perusahaan: <b>{{ userProfile.details.nama_perusahaan }}</b></span
                      >
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- <div class="bg-white rounded-lg shadow-sm p-6 md:p-8 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><i class="fas fa-chart-line text-blue-500"></i> Aktivitas</h2>
            <div class="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <i class="fas fa-ghost text-4xl mb-3 opacity-50"></i>
              <p>Belum ada aktivitas untuk ditampilkan.</p>
            </div>
          </div> -->
        </div>

        <div v-else class="max-w-5xl mx-auto flex flex-col items-center justify-center py-20 text-gray-500">
          <i class="fas fa-user-slash text-6xl mb-4 text-gray-300"></i>
          <p class="text-lg">Pengguna tidak ditemukan.</p>
          <router-link to="/" class="mt-4 text-blue-600 hover:underline">Kembali ke Beranda</router-link>
        </div>
      </main>
    </div>

    <Dialog v-model:visible="showEditDialog" modal header="Edit Profil" :draggable="false" class="w-full max-w-lg mx-4">
      <div class="flex flex-col gap-6 pt-2">
        <div class="flex flex-col items-center gap-3">
          <div class="relative group cursor-pointer">
            <img :src="filePreview || `https://ui-avatars.com/api/?name=${userProfile.fullname}&background=random`" class="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm group-hover:opacity-70 transition" />
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition" @click="$refs.fileInput.click()">
              <i class="fas fa-camera text-white text-2xl drop-shadow-md"></i>
            </div>
          </div>

          <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileChange" />
          <button @click="$refs.fileInput.click()" class="text-sm text-blue-600 font-medium hover:underline bg-transparent border-none cursor-pointer">Ubah Foto Profil</button>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-bold text-gray-700">Username</label>
            <InputText v-model="editForm.username" class="w-full" />
            <small class="text-gray-500">Username harus unik dan tanpa spasi.</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-bold text-gray-700">Bio</label>
            <Textarea v-model="editForm.bio" rows="3" class="w-full" placeholder="Ceritakan sedikit tentang diri Anda..." />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <Button label="Batal" severity="secondary" text @click="showEditDialog = false" />
          <Button label="Simpan" @click="handleUpdateProfile" :loading="updating" :disabled="!editForm.username" class="bg-blue-600! hover:bg-blue-700! border-none!" />
        </div>
      </div>
    </Dialog>
  </LayoutDefaultUser>
</template>

<style scoped>
/* Styling khusus untuk menu agar rapi */
:deep(.p-menu) {
  font-size: 0.9rem;
}
</style>
