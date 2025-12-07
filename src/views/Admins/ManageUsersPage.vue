<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import { ref, reactive, onMounted, computed } from "vue";
import { useToast } from "primevue";
import Dialog from "primevue/dialog";
import Paginator from "primevue/paginator";
import adminApi from "@/services/adminApi";

const toast = useToast();

// state list
const users = ref([]);
const loading = ref(false);
const page = ref(1);
const perPage = ref(10);
const total = ref(0);
const searchQ = ref("");
const roleFilter = ref(""); // '' means all
const sortBy = ref("created_at");
const sortDir = ref("DESC");

const roleOptions = ["Admin", "Dosen", "Mahasiswa", "Alumni", "Mitra", "Pakar"];

// --- Add User modal ---
const showAddModal = ref(false);
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
  tahun_lulus: "",
  nama_perusahaan: "",
  jabatan: "",
  path_to_profile_picture: null, // optional file input
});
const addLoading = ref(false);

// Edit role modal
const showEditRoleModal = ref(false);
const editUserId = ref(null);
const editRole = ref("");

// tambahan state untuk bulk select
const selectedIds = ref(new Set());
const selectAll = ref(false);

// Promote modal
const showPromoteModal = ref(false);
const promoteUseEstimated = ref(true);
const promoteTahunLulus = ref(null);
const promoteLoading = ref(false);

// Helpers
const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getUsers({
      page: page.value,
      per_page: perPage.value,
      role: roleFilter.value || undefined,
      q: searchQ.value || undefined,
      sort_by: sortBy.value,
      sort_dir: sortDir.value,
    });
    const data = res.data.data;
    users.value = data.items || [];
    total.value = data.total || 0;

    // Reset selection on page change/fetch
    selectedIds.value.clear();
    selectAll.value = false;
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal memuat user", life: 5000 });
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

const openAddModal = () => {
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
    tahun_lulus: "",
    nama_perusahaan: "",
    jabatan: "",
    path_to_profile_picture: null,
  });
  showAddModal.value = true;
};

const handleFileChange = (e) => {
  const f = e.target.files[0];
  addForm.path_to_profile_picture = f || null;
};

const submitAddUser = async () => {
  // basic validation
  if (!addForm.fullname || !addForm.username || !addForm.email || !addForm.password || !addForm.role) {
    toast.add({ severity: "warn", summary: "Form tidak lengkap", detail: "Isi nama, username, email, password, role", life: 5000 });
    return;
  }

  // role-specific validation (frontend convenience)
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
    // profile data as JSON string for backend convenience
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
    } else if (addForm.role === "Pakar") {
      profileData.bidang_keahlian = addForm.bidang_keahlian;
    } else if (addForm.role === "Mitra") {
      profileData.nama_perusahaan = addForm.nama_perusahaan;
      profileData.jabatan = addForm.jabatan;
    }
    fd.append("profile_data", JSON.stringify(profileData));

    if (addForm.path_to_profile_picture) {
      fd.append("profile_picture", addForm.path_to_profile_picture); // backend must handle upload if implemented
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

const openEditRole = (user) => {
  editUserId.value = user.id;
  editRole.value = user.role_name;
  showEditRoleModal.value = true;
};

const submitEditRole = async () => {
  if (!editUserId.value || !editRole.value) return;
  try {
    await adminApi.updateUserRole(editUserId.value, editRole.value);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Role diperbarui" });
    showEditRoleModal.value = false;
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal update role", life: 5000 });
  }
};

const toggleActive = async (user) => {
  try {
    await adminApi.toggleActiveUser(user.id);
    toast.add({ severity: "success", summary: "Berhasil", detail: user.is_active ? "User dinonaktifkan" : "User diaktifkan", life: 5000 });
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal ubah status", life: 5000 });
  }
};

const deleteUser = async (user) => {
  if (!confirm("Yakin ingin menghapus user ini?")) return;
  try {
    await adminApi.deleteUser(user.id);
    toast.add({ severity: "success", summary: "Berhasil", detail: "User dihapus", life: 5000 });
    fetchUsers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal hapus user", life: 5000 });
  }
};

// Toggle select one
const toggleSelect = (id) => {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);

  // update selectAll checkbox if needed
  if (selectedIds.value.size === users.value.length && users.value.length > 0) {
    selectAll.value = true;
  } else {
    selectAll.value = false;
  }
};

// Toggle select all on current page
const toggleSelectAllOnPage = () => {
  if (!selectAll.value) {
    // select all current page user ids
    users.value.forEach((u) => selectedIds.value.add(u.id));
    selectAll.value = true;
  } else {
    // clear
    users.value.forEach((u) => selectedIds.value.delete(u.id));
    selectAll.value = false;
  }
};

// Open promote modal
const openPromoteModal = () => {
  if (selectedIds.value.size === 0) {
    toast.add({ severity: "warn", summary: "Pilih Mahasiswa", detail: "Pilih minimal 1 mahasiswa untuk dipromosikan.", life: 5000 });
    return;
  }
  showPromoteModal.value = true;
  promoteUseEstimated.value = true;
  promoteTahunLulus.value = null;
};

// Submit promote
const submitPromote = async () => {
  const ids = Array.from(selectedIds.value);
  if (ids.length === 0) return;

  promoteLoading.value = true;
  try {
    const payload = {
      user_ids: ids,
      use_estimated: promoteUseEstimated.value,
    };
    if (!promoteUseEstimated.value && promoteTahunLulus.value) {
      payload.tahun_lulus = parseInt(promoteTahunLulus.value, 10);
    }

    const res = await adminApi.promoteToAlumni(payload);
    toast.add({ severity: "success", summary: "Selesai", detail: "Promosi mahasiswa ke alumni selesai.", life: 5000 });

    // clear selection, close modal, refresh list
    selectedIds.value.clear();
    selectAll.value = false;
    showPromoteModal.value = false;
    fetchUsers();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal promosi", life: 5000 });
  } finally {
    promoteLoading.value = false;
  }
};

// UI Helpers
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
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
          <p class="text-sm text-gray-500 mt-1">Kelola data pengguna, role, dan status akun dalam platform.</p>
        </div>
        <button @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
          <i class="fa-solid fa-plus"></i>
          Tambah User Baru
        </button>
      </div>

      <!-- Stats Summary Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pengguna Terdaftar</p>
            <h2 class="text-3xl font-extrabold text-gray-900">{{ total }}</h2>
          </div>
          <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <i class="fa-solid fa-users text-xl"></i>
          </div>
        </div>
      </div>

      <!-- Bulk Action Bar (Visible when selected) -->
      <transition name="fade">
        <div v-if="selectedIds.size > 0" class="mb-4 bg-blue-600 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm">{{ selectedIds.size }} Dipilih</span>
            <span class="text-sm">Tindakan massal tersedia untuk pengguna yang dipilih.</span>
          </div>
          <button @click="openPromoteModal" class="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
            <i class="fa-solid fa-graduation-cap"></i>
            Promote ke Alumni
          </button>
        </div>
      </transition>

      <!-- Main Content -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <!-- Filters Toolbar -->
        <div class="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="relative w-full md:w-80">
            <div class="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
              <i class="fas fa-search text-gray-400"></i>
            </div>
            <input
              v-model="searchQ"
              @keyup.enter="fetchUsers"
              type="text"
              placeholder="Cari nama, email, atau username..."
              class="block w-full p-2.5 ps-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap"><i class="fa-solid fa-filter"></i> Filter:</div>
            <select v-model="roleFilter" @change="fetchUsers" class="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none cursor-pointer">
              <option value="">Semua Role</option>
              <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <div v-if="loading" class="p-12 text-center text-gray-400 flex flex-col items-center">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
            <p>Memuat data pengguna...</p>
          </div>

          <table v-else class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" class="p-4 w-4">
                  <div class="flex items-center">
                    <input type="checkbox" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" v-model="selectAll" @change="toggleSelectAllOnPage" />
                  </div>
                </th>
                <th class="px-6 py-4 font-bold tracking-wider">Identitas User</th>
                <th class="px-6 py-4 font-bold tracking-wider">Role</th>
                <th class="px-6 py-4 font-bold tracking-wider">Ringkasan Profil</th>
                <th class="px-6 py-4 font-bold tracking-wider text-center">Status</th>
                <th class="px-6 py-4 font-bold tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(u, idx) in users" :key="u.id" class="bg-white hover:bg-blue-50/30 transition-colors group">
                <td class="w-4 p-4">
                  <div class="flex items-center">
                    <input type="checkbox" :checked="selectedIds.has(u.id)" @change="() => toggleSelect(u.id)" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                  </div>
                </td>

                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <!-- Avatar with fallback -->
                    <div class="relative">
                      <img v-if="u.profile_picture" :src="u.profile_picture" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      <div v-else class="w-10 h-10 rounded-full bg-linear-to-br from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm border border-gray-300">
                        {{ u.fullname.charAt(0).toUpperCase() }}
                      </div>
                    </div>

                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900">{{ u.fullname }}</span>
                      <span class="text-xs text-gray-500">@{{ u.username }}</span>
                      <span class="text-[10px] text-gray-400 mt-0.5">{{ u.email }}</span>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border shadow-sm" :class="getRoleColor(u.role_name)">
                    {{ u.role_name }}
                  </span>
                </td>

                <td class="px-6 py-4 text-xs text-gray-600">
                  <div class="bg-gray-50 p-2 rounded border border-gray-100 max-w-[250px]">
                    <template v-if="u.role_name === 'Mahasiswa'">
                      <div class="font-semibold text-gray-800">{{ u.prodi }}</div>
                      <div>NIM: {{ u.nim }} • Angkatan {{ u.tahun_masuk }}</div>
                    </template>
                    <template v-else-if="u.role_name === 'Dosen'">
                      <div class="font-semibold text-gray-800">{{ u.dosen_bidang || "Bidang -" }}</div>
                      <div>NIDN: {{ u.nidn }}</div>
                    </template>
                    <template v-else-if="u.role_name === 'Alumni'"> <i class="fa-solid fa-graduation-cap mr-1"></i> Lulus Th. {{ u.alumni_tahun_lulus }} </template>
                    <template v-else-if="u.role_name === 'Mitra'">
                      <div class="font-bold">{{ u.mitra_perusahaan }}</div>
                      <div>{{ u.mitra_jabatan }}</div>
                    </template>
                    <template v-else-if="u.role_name === 'Pakar'">
                      <div class="font-semibold">{{ u.pakar_bidang || "-" }}</div>
                    </template>
                    <template v-else>
                      <span class="italic text-gray-400">Tidak ada info tambahan</span>
                    </template>
                  </div>
                </td>

                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" :class="u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                    <i class="fa-solid fa-circle text-[6px]" :class="u.is_active ? 'text-green-500' : 'text-red-500'"></i>
                    {{ u.is_active ? "Aktif" : "Nonaktif" }}
                  </span>
                </td>

                <td class="px-6 py-4 text-center">
                  <div class="flex justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button @click="openEditRole(u)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors" title="Edit Role">
                      <i class="fa-solid fa-user-tag"></i>
                    </button>
                    <button
                      @click="toggleActive(u)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                      :class="u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'"
                      :title="u.is_active ? 'Nonaktifkan' : 'Aktifkan'"
                    >
                      <i class="fa-solid" :class="u.is_active ? 'fa-ban' : 'fa-check'"></i>
                    </button>
                    <button @click="deleteUser(u)" class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors" title="Hapus User">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="users.length === 0 && !loading">
                <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                  <div class="flex flex-col items-center gap-3">
                    <i class="fa-solid fa-user-slash text-4xl text-gray-200"></i>
                    <p>Tidak ada pengguna ditemukan.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex justify-end">
            <Paginator :rows="perPage" :totalRecords="total" :first="(page - 1) * perPage" :rowsPerPageOptions="[5, 10, 20]" @page="onPageChange" />
          </div>
        </div>
      </div>

      <!-- Add User Modal -->
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
            <!-- Account Info -->
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

            <!-- DYNAMIC FIELDS -->
            <div v-if="addForm.role === 'Mahasiswa'" class="contents animate-fade">
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

            <div v-else-if="addForm.role === 'Dosen'" class="contents animate-fade">
              <div><label class="block text-xs font-bold text-gray-700 mb-1">NIDN</label><input v-model="addForm.nidn" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Bidang Keahlian</label><input v-model="addForm.bidang_keahlian" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div v-else-if="addForm.role === 'Alumni'" class="contents animate-fade">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Tahun Lulus</label
                ><input v-model="addForm.tahun_lulus" type="number" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div v-else-if="addForm.role === 'Mitra'" class="contents animate-fade">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Nama Perusahaan</label><input v-model="addForm.nama_perusahaan" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" />
              </div>
              <div><label class="block text-xs font-bold text-gray-700 mb-1">Jabatan</label><input v-model="addForm.jabatan" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none" /></div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Bio (Opsional)</label>
              <textarea v-model="addForm.bio" rows="2" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-blue-500 outline-none"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-gray-700 mb-1">Foto Profil</label>
              <input
                type="file"
                @change="handleFileChange"
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

      <!-- Edit Role Modal -->
      <Dialog v-model:visible="showEditRoleModal" header="Edit Role Pengguna" :style="{ width: '420px' }" modal :pt="{ root: { class: 'rounded-xl shadow-2xl border-0' }, header: { class: 'bg-white border-b border-gray-100 pb-3' } }">
        <div class="p-4">
          <p class="text-sm text-gray-500 mb-4">Mengubah role pengguna mungkin akan mengubah akses fitur mereka.</p>
          <label class="text-xs font-bold text-gray-700 mb-1 block">Role Baru</label>
          <select v-model="editRole" class="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3 px-4 pb-2">
            <button @click="showEditRoleModal = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
            <button @click="submitEditRole" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Simpan Perubahan</button>
          </div>
        </template>
      </Dialog>

      <!-- Promote Modal -->
      <Dialog v-model:visible="showPromoteModal" header="Promosi Mahasiswa → Alumni" :style="{ width: '520px' }" modal :pt="{ root: { class: 'rounded-xl shadow-2xl border-0' } }">
        <div class="space-y-4 p-2">
          <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 text-sm flex items-center gap-3">
            <i class="fa-solid fa-graduation-cap text-xl"></i>
            <div>
              <p class="font-bold">Promosi Massal</p>
              <p>
                Anda memilih <strong>{{ selectedIds.size }}</strong> pengguna untuk dipromosikan.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <label class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" :class="promoteUseEstimated ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'">
              <input type="radio" id="use_est" value="1" v-model="promoteUseEstimated" true-value="true" false-value="false" @change="promoteUseEstimated = true" class="mt-1" />
              <div class="text-sm">
                <span class="font-bold block text-gray-900">Gunakan Data Estimasi</span>
                <span class="text-gray-500 text-xs">Sistem akan menggunakan 'Tahun Perkiraan Lulus' yang sudah ada di profil mahasiswa.</span>
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" :class="!promoteUseEstimated ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'">
              <input type="radio" id="manual" value="0" v-model="promoteUseEstimated" @change="promoteUseEstimated = false" class="mt-1" />
              <div class="text-sm w-full">
                <span class="font-bold block text-gray-900">Set Manual Tahun Lulus</span>
                <span class="text-gray-500 text-xs mb-2 block">Tentukan tahun lulus yang sama untuk semua yang dipilih.</span>
                <input v-if="!promoteUseEstimated" v-model="promoteTahunLulus" type="number" placeholder="Contoh: 2024" class="w-full border border-gray-300 px-3 py-2 rounded text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </label>
          </div>

          <p class="text-xs text-gray-400 italic mt-2 text-center">User yang bukan role 'Mahasiswa' akan dilewati otomatis oleh sistem.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3 pt-2">
            <button @click="showPromoteModal = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
            <button @click="submitPromote" :disabled="promoteLoading" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2">
              <i v-if="promoteLoading" class="fa-solid fa-spinner fa-spin"></i>
              {{ promoteLoading ? "Memproses..." : "Konfirmasi Promosi" }}
            </button>
          </div>
        </template>
      </Dialog>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
.animate-fade {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Custom Paginator Style override */
:deep(.p-paginator) {
  background: transparent;
  padding: 0;
}
:deep(.p-paginator-page.p-highlight) {
  background: #eff6ff;
  color: #2563eb;
  border-radius: 8px;
  font-weight: bold;
}
:deep(.p-paginator-page) {
  border-radius: 8px;
  font-size: 0.85rem;
}
</style>
