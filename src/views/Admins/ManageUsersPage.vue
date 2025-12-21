<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import { ref, reactive, onMounted, watch } from "vue";
import { useConfirm, useToast } from "primevue";
import Dialog from "primevue/dialog";
import Paginator from "primevue/paginator";
import adminApi from "@/services/adminApi";
import ConfirmDialog from "primevue/confirmdialog";

const toast = useToast();
const confirm = useConfirm();

// --- STATE LIST ---
const users = ref([]);
const loading = ref(false);
const page = ref(1);
const perPage = ref(2);
const total = ref(0);
const searchQ = ref("");
let searchTimeout = null;
const roleFilter = ref("");
const roleOptions = ["Admin", "Dosen", "Mahasiswa", "Alumni", "Mitra", "Pakar"];

// --- STATE MODALS ---
const showAddModal = ref(false);
const showEditModal = ref(false); // Menggantikan Edit Role
const showPromoteModal = ref(false);
const addLoading = ref(false);
const submitLoading = ref(false); // Loading untuk Edit

// --- FORMS ---

// 1. ADD FORM (Sesuai Kode Asli Anda)
const addForm = reactive({
  fullname: "",
  username: "",
  email: "",
  password: "",
  role: "Mahasiswa",
  bio: "",
  // profile fields
  nim: "",
  prodi: "",
  tahun_masuk: "",
  tahun_perkiraan_lulus: "",
  nidn: "",
  bidang_keahlian: "",
  instansi_asal: "",
  tahun_lulus: "",
  pekerjaan_saat_ini: "",
  nama_perusahaan: "",
  jabatan: "",
  alamat_perusahaan: "",
  profile_picture: null,
});

// 2. EDIT FORM (Dimodifikasi: Fullname, Username, Role, Photo)
const editForm = reactive({
  id: null,
  fullname: "",
  username: "",
  role: "",
  password: "",
  profile_picture: null, // File baru
  preview_url: null, // URL Preview
  delete_picture: false, // Flag hapus
});

// Bulk Select State
const selectedIds = ref(new Set());
const selectAll = ref(false);

// Promote State
const promoteUseEstimated = ref(true);
const promoteTahunLulus = ref(null);
const promoteLoading = ref(false);

// --- WATCHERS (Debounce Search) ---
watch(searchQ, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    fetchUsers();
  }, 500);
});

// --- FETCH DATA ---
const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getUsers({
      page: page.value,
      per_page: perPage.value,
      role: roleFilter.value || undefined,
      q: searchQ.value || undefined,
      sort_by: "created_at",
      sort_dir: "DESC",
    });
    const data = res.data.data;
    users.value = data.items || [];
    total.value = data.total || 0;
    selectedIds.value.clear();
    selectAll.value = false;
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memuat user", life: 3000 });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);

const onPageChange = (event) => {
  page.value = event.page + 1;
  perPage.value = event.rows;
  fetchUsers();
};

// --- HANDLERS: ADD USER (KODE ASLI) ---
const openAddModal = () => {
  // Reset manual sesuai kode asli
  Object.assign(addForm, {
    fullname: "",
    username: "",
    email: "",
    password: "",
    role: "Mahasiswa",
    bio: "",
    nim: "",
    prodi: "",
    tahun_masuk: "",
    tahun_perkiraan_lulus: "",
    nidn: "",
    bidang_keahlian: "",
    instansi_asal: "",
    tahun_lulus: "",
    pekerjaan_saat_ini: "",
    nama_perusahaan: "",
    jabatan: "",
    alamat_perusahaan: "",
    profile_picture: null,
  });
  showAddModal.value = true;
};

const handleAddFileChange = (e) => {
  const f = e.target.files[0];
  addForm.profile_picture = f || null;
};

const submitAddUser = async () => {
  if (!addForm.fullname || !addForm.username || !addForm.email || !addForm.password || !addForm.role) {
    toast.add({ severity: "warn", summary: "Form tidak lengkap", detail: "Isi nama, username, email, password, role", life: 5000 });
    return;
  }

  if (addForm.role === "Mahasiswa") {
    if (!addForm.nim || !addForm.prodi || !addForm.tahun_masuk) {
      toast.add({ severity: "warn", summary: "Form tidak lengkap", detail: "Isi nim, prodi, tahun masuk untuk Mahasiswa", life: 5000 });
      return;
    }
  }

  addLoading.value = true;

  try {
    const fd = new FormData();
    fd.append("fullname", addForm.fullname);
    fd.append("username", addForm.username);
    fd.append("email", addForm.email);
    fd.append("password", addForm.password);
    fd.append("role", addForm.role);
    fd.append("bio", addForm.bio || "");

    const profileData = {};
    if (addForm.role === "Mahasiswa") {
      profileData.nim = addForm.nim;
      profileData.prodi = addForm.prodi;
      profileData.tahun_masuk = addForm.tahun_masuk;
      if (addForm.tahun_perkiraan_lulus) profileData.tahun_perkiraan_lulus = addForm.tahun_perkiraan_lulus;
    } else if (addForm.role === "Dosen") {
      profileData.nidn = addForm.nidn;
      profileData.bidang_keahlian = addForm.bidang_keahlian;
    } else if (addForm.role === "Alumni") {
      profileData.tahun_lulus = addForm.tahun_lulus;
      profileData.pekerjaan_saat_ini = addForm.pekerjaan_saat_ini;
      profileData.nama_perusahaan = addForm.nama_perusahaan;
    } else if (addForm.role === "Pakar") {
      profileData.bidang_keahlian = addForm.bidang_keahlian;
      profileData.instansi_asal = addForm.instansi_asal;
    } else if (addForm.role === "Mitra") {
      profileData.nama_perusahaan = addForm.nama_perusahaan;
      profileData.jabatan = addForm.jabatan;
      profileData.alamat_perusahaan = addForm.alamat_perusahaan;
    }
    fd.append("profile_data", JSON.stringify(profileData));

    if (addForm.profile_picture) {
      fd.append("profile_picture", addForm.profile_picture);
    }

    await adminApi.createUser(fd);
    toast.add({ severity: "success", summary: "Berhasil", detail: "User dibuat" });
    showAddModal.value = false;
    fetchUsers();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal membuat user", life: 5000 });
  } finally {
    addLoading.value = false;
  }
};

// --- HANDLERS: EDIT USER (MODIFIKASI) ---
const openEditModal = (user) => {
  editForm.id = user.id;
  editForm.fullname = user.fullname;
  editForm.username = user.username;
  editForm.role = user.role_name;
  editForm.password = "";

  // Setup Preview Gambar
  editForm.profile_picture = null;
  editForm.delete_picture = false;
  // Gunakan URL dari backend jika ada, atau null
  editForm.preview_url = user.profile_picture || null;

  showEditModal.value = true;
};

const handleEditFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    editForm.profile_picture = file;
    editForm.preview_url = URL.createObjectURL(file); // Preview lokal
    editForm.delete_picture = false;
  }
};

const removeEditProfilePicture = () => {
  editForm.profile_picture = null;
  editForm.preview_url = null;
  editForm.delete_picture = true; // Flag hapus
};

const submitEditUser = async () => {
  submitLoading.value = true;
  try {
    const fd = new FormData();
    fd.append("fullname", editForm.fullname);
    fd.append("username", editForm.username);
    fd.append("role", editForm.role);

    if (editForm.password) fd.append("password", editForm.password);

    if (editForm.delete_picture) {
      fd.append("delete_profile_picture", "1");
    } else if (editForm.profile_picture) {
      fd.append("profile_picture", editForm.profile_picture);
    }

    // Pastikan adminApi.updateUser memanggil endpoint update yang sudah dimodifikasi
    await adminApi.updateUser(editForm.id, fd);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Data user diperbarui", life: 3000 });
    showEditModal.value = false;
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal update user", life: 3000 });
  } finally {
    submitLoading.value = false;
  }
};

// --- HANDLERS: ACTIONS ---
const confirmToggleActive = (user) => {
  const action = user.is_active ? "menonaktifkan" : "mengaktifkan";
  const colorClass = user.is_active ? "p-button-danger" : "p-button-success";

  confirm.require({
    message: `Apakah Anda yakin ingin ${action} akun ${user.fullname}?`,
    header: "Konfirmasi Status",
    icon: "pi pi-exclamation-circle",
    acceptClass: colorClass,
    acceptLabel: "Ya, Lanjutkan",
    rejectLabel: "Batal",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      await toggleActive(user);
    },
  });
};

const toggleActive = async (user) => {
  try {
    await adminApi.toggleActiveUser(user.id);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Status akun diperbarui", life: 3000 });
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal ubah status", life: 3000 });
  }
};

const confirmDeleteUser = (user) => {
  confirm.require({
    message: `Akun ${user.fullname} akan dihapus permanen. Lanjutkan?`,
    header: "Hapus User",
    icon: "pi pi-trash",
    acceptClass: "p-button-danger",
    acceptLabel: "Hapus",
    rejectLabel: "Batal",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      await deleteUser(user);
    },
  });
};

const deleteUser = async (user) => {
  try {
    await adminApi.deleteUser(user.id);
    toast.add({ severity: "success", summary: "Berhasil", detail: "User dihapus", life: 3000 });
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal hapus user", life: 3000 });
  }
};

// --- BULK ACTIONS ---
const toggleSelect = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
  selectAll.value = selectedIds.value.size === users.value.length && users.value.length > 0;
};

const toggleSelectAllOnPage = () => {
  if (!selectAll.value) {
    users.value.forEach((u) => selectedIds.value.add(u.id));
    selectAll.value = true;
  } else {
    users.value.forEach((u) => selectedIds.value.delete(u.id));
    selectAll.value = false;
  }
};

// --- PROMOTE HANDLERS ---
const openPromoteModal = () => {
  if (selectedIds.value.size === 0) {
    toast.add({ severity: "warn", summary: "Pilih User", detail: "Pilih minimal 1 mahasiswa.", life: 3000 });
    return;
  }
  showPromoteModal.value = true;
  promoteUseEstimated.value = true;
  promoteTahunLulus.value = null;
};

const submitPromote = async () => {
  promoteLoading.value = true;
  try {
    const payload = {
      user_ids: Array.from(selectedIds.value),
      use_estimated: promoteUseEstimated.value,
      tahun_lulus: !promoteUseEstimated.value && promoteTahunLulus.value ? parseInt(promoteTahunLulus.value) : undefined,
    };

    await adminApi.promoteToAlumni(payload);
    toast.add({ severity: "success", summary: "Selesai", detail: "Promosi berhasil.", life: 3000 });
    selectedIds.value.clear();
    selectAll.value = false;
    showPromoteModal.value = false;
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal promosi", life: 3000 });
  } finally {
    promoteLoading.value = false;
  }
};

// Helper UI
const getRoleColor = (role) => {
  switch (role) {
    case "Admin":
      return "bg-gray-800 text-white";
    case "Dosen":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Mahasiswa":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Alumni":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mitra":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Pakar":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};
</script>

<template>
  <LayoutAdminUser>
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
          <p class="text-sm text-gray-500 mt-1">Kelola data pengguna, role, dan status akun.</p>
        </div>
        <button @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer">
          <i class="fa-solid fa-plus"></i> Tambah User Baru
        </button>
      </div>

      <transition name="fade">
        <div v-if="selectedIds.size > 0" class="mb-4 bg-blue-600 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm">{{ selectedIds.size }} Dipilih</span>
            <span class="text-sm">Tindakan massal tersedia.</span>
          </div>
          <button @click="openPromoteModal" class="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
            <i class="fa-solid fa-graduation-cap"></i> Promote ke Alumni
          </button>
        </div>
      </transition>

      <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div class="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="relative w-full md:w-80">
            <span class="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none text-gray-400"><i class="fas fa-search"></i></span>
            <input
              v-model="searchQ"
              type="text"
              placeholder="Cari nama, username..."
              class="block w-full p-2.5 ps-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap"><i class="fa-solid fa-filter"></i> Filter:</div>
            <select v-model="roleFilter" @change="fetchUsers" class="bg-gray-50 border border-gray-200 text-sm rounded-lg block w-full p-2.5 outline-none cursor-pointer">
              <option value="">Semua Role</option>
              <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <div v-if="loading" class="p-12 text-center text-gray-400 flex flex-col items-center">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
            <p>Memuat data...</p>
          </div>

          <table v-else class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <!-- <th class="p-4 w-4"><input type="checkbox" class="w-4 h-4 rounded cursor-pointer" v-model="selectAll" @change="toggleSelectAllOnPage" /></th> -->
                <th class="px-6 py-4 font-bold">Identitas User</th>
                <th class="px-6 py-4 font-bold">Role</th>
                <th class="px-6 py-4 font-bold">Ringkasan Profil</th>
                <th class="px-6 py-4 font-bold text-center">Status</th>
                <th class="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="u in users" :key="u.id" class="bg-white hover:bg-blue-50/30 transition-colors group">
                <!-- <td class="w-4 p-4"><input type="checkbox" :checked="selectedIds.has(u.id)" @change="toggleSelect(u.id)" class="w-4 h-4 cursor-pointer" /></td> -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <img :src="u.profile_picture || `https://ui-avatars.com/api/?name=${u.fullname}&background=random`" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900">{{ u.fullname }}</span>
                      <span class="text-xs text-gray-500">@{{ u.username }}</span>
                      <span class="text-[10px] text-gray-400">{{ u.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border shadow-sm" :class="getRoleColor(u.role_name)">{{ u.role_name }}</span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-600">
                  <div class="bg-gray-50 p-2 rounded border border-gray-100 max-w-[250px]">
                    <span v-if="u.role_name === 'Mahasiswa'"
                      ><b>{{ u.prodi }}</b
                      ><br />NIM: {{ u.nim }}</span
                    >
                    <span v-else-if="u.role_name === 'Dosen'"
                      ><b>{{ u.dosen_bidang }}</b
                      ><br />NIDN: {{ u.nidn }}</span
                    >
                    <span v-else class="italic text-gray-400">Lihat detail di edit</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" :class="u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                    <i class="fa-solid fa-circle text-[6px]" :class="u.is_active ? 'text-green-500' : 'text-red-500'"></i>
                    {{ u.is_active ? "Aktif" : "Nonaktif" }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2">
                    <button @click="openEditModal(u)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer" title="Edit User">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button
                      @click="confirmToggleActive(u)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                      :class="u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'"
                      :title="u.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                    >
                      <i class="fa-solid" :class="u.is_active ? 'fa-ban' : 'fa-check'"></i>
                    </button>
                    <button @click="confirmDeleteUser(u)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer" title="Hapus">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="6" class="text-center py-12 text-gray-400">Tidak ada pengguna.</td>
              </tr>
            </tbody>
          </table>
          <div class="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex justify-end">
            <Paginator :rows="perPage" :totalRecords="total" :first="(page - 1) * perPage" @page="onPageChange" />
          </div>
        </div>
      </div>

      <Dialog
        v-model:visible="showAddModal"
        header="Tambah Pengguna Baru"
        :style="{ width: '750px' }"
        modal
        :pt="{
          root: { class: 'rounded-xl shadow-2xl border-0' },
          header: { class: 'bg-white border-b border-gray-100 pb-4 rounded-t-xl' },
          content: { class: 'p-0' },
        }"
      >
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div class="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs"><i class="fa-solid fa-user-shield"></i></div>
                Informasi Akun
              </h4>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
              <input v-model="addForm.fullname" type="text" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Budi Santoso" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Username <span class="text-red-500">*</span></label>
              <input v-model="addForm.username" type="text" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="tanpa spasi" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Email <span class="text-red-500">*</span></label>
              <input v-model="addForm.email" type="email" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@domain.com" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Password <span class="text-red-500">*</span></label>
              <input v-model="addForm.password" type="password" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="******" />
            </div>

            <div class="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <div class="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs"><i class="fa-solid fa-id-badge"></i></div>
                Role & Profil
              </h4>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Role Pengguna <span class="text-red-500">*</span></label>
              <select v-model="addForm.role" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>

            <div v-if="addForm.role === 'Mahasiswa'" class="contents">
              <div><label class="block text-xs font-bold text-gray-700 mb-1">NIM</label><input v-model="addForm.nim" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
              <div><label class="block text-xs font-bold text-gray-700 mb-1">Prodi</label><input v-model="addForm.prodi" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Tahun Masuk</label
                ><input v-model="addForm.tahun_masuk" type="number" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Perkiraan Lulus</label
                ><input v-model="addForm.tahun_perkiraan_lulus" type="number" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div v-else-if="addForm.role === 'Dosen'" class="contents">
              <div><label class="block text-xs font-bold text-gray-700 mb-1">NIDN</label><input v-model="addForm.nidn" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Bidang Keahlian</label><input v-model="addForm.bidang_keahlian" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div v-else-if="addForm.role === 'Alumni'" class="contents">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Tahun Lulus</label
                ><input v-model="addForm.tahun_lulus" type="number" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Pekerjaan Saat Ini</label
                ><input v-model="addForm.pekerjaan_saat_ini" type="text" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Nama Perusahaan</label
                ><input v-model="addForm.nama_perusahaan" type="text" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div v-else-if="addForm.role === 'Mitra'" class="contents">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Nama Perusahaan</label><input v-model="addForm.nama_perusahaan" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div><label class="block text-xs font-bold text-gray-700 mb-1">Jabatan</label><input v-model="addForm.jabatan" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Alamat Perusahaan</label
                ><input v-model="addForm.alamat_perusahaan" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div v-else-if="addForm.role === 'Pakar'" class="contents">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Bidang Keahlian</label><input v-model="addForm.bidang_keahlian" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Instansi Asal</label><input v-model="addForm.instansi_asal" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Bio (Opsional)</label>
              <textarea v-model="addForm.bio" rows="2" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Foto Profil</label>
              <input
                type="file"
                @change="handleAddFileChange"
                class="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3 px-6 pb-6 pt-2">
            <button @click="showAddModal = false" class="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">Batal</button>
            <button @click="submitAddUser" :disabled="addLoading" class="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2">
              <i v-if="addLoading" class="fa-solid fa-spinner fa-spin"></i>
              {{ addLoading ? "Memproses..." : "Buat User" }}
            </button>
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="showEditModal" header="Edit Data Pengguna" :style="{ width: '550px' }" modal :pt="{ root: { class: 'rounded-xl border-0' }, header: { class: 'border-b pb-3' } }">
        <div class="p-5 space-y-4">
          <div class="flex flex-col items-center justify-center gap-3 pb-4 border-b border-gray-100">
            <div class="relative w-24 h-24 rounded-full border-2 border-gray-100 shadow-sm overflow-hidden group bg-gray-50">
              <img v-if="editForm.preview_url && !editForm.delete_picture" :src="editForm.preview_url" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400"><i class="fa-solid fa-user text-4xl"></i></div>

              <label class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <i class="fa-solid fa-camera mb-1"></i>
                <span class="text-[10px]">Ubah Foto</span>
                <input type="file" class="hidden" @change="handleEditFileChange" accept="image/*" />
              </label>
            </div>
            <div v-if="(editForm.preview_url || editForm.profile_picture) && !editForm.delete_picture">
              <button @click="removeEditProfilePicture" class="text-xs text-red-600 hover:text-red-800 font-medium hover:underline flex items-center gap-1"><i class="fa-solid fa-trash-can"></i> Hapus Foto (Reset Default)</button>
            </div>
            <div v-if="editForm.delete_picture" class="text-xs text-orange-600 font-medium">Foto akan dihapus saat disimpan.</div>
          </div>

          <div><label class="text-xs font-bold block mb-1">Nama Lengkap</label><input v-model="editForm.fullname" class="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="text-xs font-bold block mb-1">Username</label><input v-model="editForm.username" class="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div>
            <label class="text-xs font-bold block mb-1">Role</label>
            <select v-model="editForm.role" class="w-full border rounded-lg px-3 py-2 text-sm bg-white">
              <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>

          <!-- <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mt-2">
            <label class="text-xs font-bold block mb-1 text-yellow-800">Ubah Password (Opsional)</label>
            <input v-model="editForm.password" type="password" placeholder="Kosongkan jika tidak ingin mengubah" class="w-full border border-yellow-200 rounded-lg px-3 py-2 text-sm focus:ring-yellow-500 bg-white" />
          </div> -->
        </div>
        <template #footer>
          <div class="flex justify-end gap-2 px-6 pb-4">
            <button @click="showEditModal = false" class="px-4 py-2 border rounded-lg text-sm">Batal</button>
            <button @click="submitEditUser" :disabled="submitLoading" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
              <i v-if="submitLoading" class="fa-solid fa-spinner fa-spin"></i> Simpan Perubahan
            </button>
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="showPromoteModal" header="Promosi ke Alumni" :style="{ width: '500px' }" modal>
        <div class="p-4 space-y-4">
          <p class="text-sm text-gray-600">
            Anda akan mempromosikan <b>{{ selectedIds.size }}</b> mahasiswa terpilih menjadi Alumni.
          </p>
          <div class="space-y-3">
            <label class="flex gap-3 items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              ><input type="radio" v-model="promoteUseEstimated" :value="true" /> <span class="text-sm">Gunakan data estimasi lulus di profil</span></label
            >
            <label class="flex gap-3 items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" v-model="promoteUseEstimated" :value="false" />
              <span class="text-sm flex items-center gap-2">Set manual tahun: <input v-if="!promoteUseEstimated" v-model="promoteTahunLulus" type="number" class="border px-2 py-1 rounded w-24 text-sm" /></span>
            </label>
          </div>
        </div>
        <template #footer>
          <button @click="showPromoteModal = false" class="px-4 py-2 border rounded-lg text-sm mr-2">Batal</button>
          <button @click="submitPromote" :disabled="promoteLoading" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Promosi</button>
        </template>
      </Dialog>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
