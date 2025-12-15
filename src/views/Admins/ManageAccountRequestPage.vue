<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import Dialog from "primevue/dialog";
import { useToast } from "primevue";
import { useConfirm } from "primevue";
import adminApi from "@/services/adminApi";

const toast = useToast();
const confirm = useConfirm();

// --- STATE DATA ---
const requests = ref([]);
const searchQuery = ref("");
const selectedStatus = ref("PENDING");
const showDetailDialog = ref(false);
const selectedRequest = ref(null);
const isProcessing = ref(false);
const rejectReason = ref("");
const showRejectInput = ref(false);
const loading = ref(false);

const statusOptions = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Disetujui", value: "APPROVED" },
  { label: "Ditolak", value: "REJECTED" },
  { label: "Teraktivasi", value: "ACTIVATED" },
  { label: "Semua", value: "Semua" },
];

// --- FETCH DATA ---
const fetchRequests = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getAccountRequests(); // GET /admin/account-requests
    const data = res.data.data || [];

    // Pastikan profile_data selalu berupa object
    requests.value = data.map((r) => ({
      ...r,
      profile_data: r.profile_data || {},
    }));
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Gagal memuat data permintaan akun.",
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRequests();
});

// --- COMPUTED KPI & FILTER ---

// Hitung statistik sederhana dari data client-side
const stats = computed(() => {
  const total = requests.value.length;
  const pending = requests.value.filter((r) => r.status === "PENDING").length;
  const approved = requests.value.filter((r) => r.status === "APPROVED").length;
  const rejected = requests.value.filter((r) => r.status === "REJECTED").length;
  const activated = requests.value.filter((r) => r.status === "ACTIVATED").length;
  return { total, pending, approved, rejected, activated };
});

const filteredRequests = computed(() => {
  return requests.value.filter((req) => {
    const matchStatus = selectedStatus.value === "Semua" || req.status === selectedStatus.value;

    const query = searchQuery.value.toLowerCase();
    const candidateName = (req.fullname || "").toLowerCase();
    const candidateEmail = (req.email || "").toLowerCase();
    const communityName = (req.community_name || "").toLowerCase();

    const matchSearch = !query || candidateName.includes(query) || candidateEmail.includes(query) || communityName.includes(query);

    return matchStatus && matchSearch;
  });
});

// --- METHODS UI ---
const getStatusBadgeClass = (status) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "APPROVED":
      return "bg-green-50 text-green-700 border-green-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    case "ACTIVATED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getRoleBadgeColor = (role) => {
  switch (role) {
    case "Alumni":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mitra":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Pakar":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const openReviewDialog = (req) => {
  selectedRequest.value = req;
  showDetailDialog.value = true;
  rejectReason.value = "";
  showRejectInput.value = false;
};

// --- ACTION: APPROVE ---
const handleApprove = () => {
  confirm.require({
    message: "Setujui permintaan akun eksternal ini?",
    header: "Konfirmasi Persetujuan",
    icon: "pi pi-check-circle",
    acceptLabel: "Ya, Setujui",
    rejectLabel: "Batal",
    acceptClass: "p-button-success",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      if (!selectedRequest.value) return;
      isProcessing.value = true;
      try {
        await adminApi.approveAccountRequest(selectedRequest.value.id);
        await fetchRequests();
        toast.add({
          severity: "success",
          summary: "Disetujui",
          detail: "Permintaan akun telah disetujui dan akun pengguna eksternal telah dibuat.",
          life: 4000,
        });
        showDetailDialog.value = false;
      } catch (err) {
        console.error(err);
        toast.add({
          severity: "error",
          summary: "Gagal",
          detail: err.response?.data?.meta?.message || "Gagal menyetujui permintaan.",
          life: 4000,
        });
      } finally {
        isProcessing.value = false;
      }
    },
  });
};

// --- ACTION: REJECT ---
const handleReject = async () => {
  if (!selectedRequest.value) return;

  if (!rejectReason.value.trim()) {
    toast.add({
      severity: "warn",
      summary: "Wajib Diisi",
      detail: "Mohon isi alasan penolakan untuk memberitahu pemohon.",
      life: 3000,
    });
    return;
  }

  isProcessing.value = true;
  try {
    await adminApi.rejectAccountRequest(selectedRequest.value.id, rejectReason.value);
    await fetchRequests();
    toast.add({
      severity: "info",
      summary: "Ditolak",
      detail: "Permintaan akun telah ditolak.",
      life: 4000,
    });
    showDetailDialog.value = false;
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Gagal menolak permintaan.",
      life: 4000,
    });
  } finally {
    isProcessing.value = false;
  }
};

// Helper format tanggal
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <LayoutAdminUser>
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 pb-12">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Verifikasi Akun</h1>
          <p class="text-sm text-gray-500 mt-1">Validasi permintaan akun dari pengguna eksternal (Alumni, Mitra, Pakar).</p>
        </div>
      </div>

      <!-- KPI SUMMARY -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Request</span>
          <span class="text-2xl font-bold text-gray-900 mt-1">{{ stats.total }}</span>
        </div>
        <div class="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col">
          <span class="text-xs font-bold text-amber-600 uppercase tracking-wide">Menunggu</span>
          <span class="text-2xl font-bold text-amber-700 mt-1">{{ stats.pending }}</span>
        </div>
        <div class="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col">
          <span class="text-xs font-bold text-green-600 uppercase tracking-wide">Disetujui</span>
          <span class="text-2xl font-bold text-green-700 mt-1">{{ stats.approved }}</span>
        </div>
        <div class="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm flex flex-col">
          <span class="text-xs font-bold text-red-600 uppercase tracking-wide">Ditolak</span>
          <span class="text-2xl font-bold text-red-700 mt-1">{{ stats.rejected }}</span>
        </div>
        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col">
          <span class="text-xs font-bold text-blue-600 uppercase tracking-wide">Teraktivasi</span>
          <span class="text-2xl font-bold text-blue-700 mt-1">{{ stats.activated }}</span>
        </div>
      </div>

      <!-- Main Content Card -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <!-- Toolbar: Filter & Search -->
        <div class="p-5 border-b border-gray-100 bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <!-- Filter Tabs -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="selectedStatus = opt.value"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer"
              :class="selectedStatus === opt.value ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
            >
              {{ opt.label }}
            </button>
          </div>

          <!-- Search Bar -->
          <div class="relative w-full lg:w-80">
            <div class="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
              <i class="fas fa-search text-gray-400"></i>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              class="block w-full p-2.5 ps-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Cari nama, email, atau komunitas..."
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <div v-if="loading" class="p-12 text-center text-gray-400 flex flex-col items-center">
            <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
            <p>Memuat data permintaan...</p>
          </div>

          <table v-else class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Kandidat</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Role Diajukan</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Komunitas (Pemohon)</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Tanggal</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider">Status</th>
                <th scope="col" class="px-6 py-4 font-bold tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="req in filteredRequests" :key="req.id" class="bg-white hover:bg-blue-50/50 transition-colors">
                <!-- User Info -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <!-- Avatar Initials -->
                    <div class="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {{ req.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900 text-sm">{{ req.fullname }}</span>
                      <span class="text-xs text-gray-500">{{ req.email }}</span>
                    </div>
                  </div>
                </td>

                <!-- Role -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border" :class="getRoleBadgeColor(req.role_name)">
                    {{ req.role_name }}
                  </span>
                </td>

                <!-- Community Info -->
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-gray-900 font-semibold text-sm">{{ req.community_name }}</span>
                    <span class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <i class="fa-solid fa-user-check text-[10px]"></i>
                      {{ req.requester_name }}
                    </span>
                  </div>
                </td>

                <!-- Date -->
                <td class="px-6 py-4 whitespace-nowrap text-xs font-medium">
                  {{ formatDateTime(req.created_at) }}
                </td>

                <!-- Status -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm" :class="getStatusBadgeClass(req.status)">
                    <i class="fa-solid fa-circle text-[6px] mr-2 animate-pulse" :class="{ 'text-amber-500': req.status === 'PENDING', 'text-green-500': req.status === 'APPROVED', 'text-red-500': req.status === 'REJECTED' }"></i>
                    {{ req.status === "PENDING" ? "Menunggu" : req.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-center">
                  <button
                    v-if="req.status === 'PENDING'"
                    @click="openReviewDialog(req)"
                    class="inline-flex items-center gap-1 font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <i class="fas fa-eye"></i> Verifikasi
                  </button>
                  <button v-else @click="openReviewDialog(req)" class="inline-flex items-center gap-1 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                    <i class="fas fa-file-alt"></i> Detail
                  </button>
                </td>
              </tr>

              <tr v-if="filteredRequests.length === 0 && !loading">
                <td colspan="6" class="px-6 py-16 text-center text-gray-500">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <i class="fas fa-inbox text-3xl text-gray-300"></i>
                    </div>
                    <span class="font-medium">Tidak ada permintaan ditemukan.</span>
                    <span class="text-xs">Cobalah mengubah filter status atau kata kunci pencarian.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- DIALOG TINJAUAN DETAIL -->
      <Dialog
        v-model:visible="showDetailDialog"
        modal
        :style="{ width: '600px' }"
        :draggable="false"
        header="Verifikasi Akun Eksternal"
        :pt="{
          root: { class: 'rounded-xl shadow-2xl border-0' },
          header: { class: 'bg-white border-b border-gray-100 pb-4 rounded-t-xl' },
          content: { class: 'p-0' },
        }"
      >
        <div v-if="selectedRequest" class="flex flex-col">
          <!-- Banner Status (Jika bukan pending) -->
          <div v-if="selectedRequest.status !== 'PENDING'" class="px-6 py-3 text-center text-sm font-bold border-b" :class="getStatusBadgeClass(selectedRequest.status)">
            Permintaan ini telah {{ selectedRequest.status === "APPROVED" ? "DISETUJUI" : "DITOLAK" }}
          </div>

          <div class="p-6 flex flex-col gap-6">
            <!-- Informasi Kandidat Card -->
            <div class="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

              <div class="w-16 h-16 rounded-full bg-white border-4 border-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-sm z-10">
                {{ selectedRequest.fullname.charAt(0).toUpperCase() }}
              </div>

              <div class="flex-1 z-10">
                <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Kandidat</p>
                <h3 class="font-bold text-gray-900 text-lg leading-tight">{{ selectedRequest.fullname }}</h3>
                <p class="text-sm text-gray-600">{{ selectedRequest.email }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <span class="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500"> @{{ selectedRequest.username }} </span>
                  <span class="text-xs font-bold px-2 py-0.5 rounded border" :class="getRoleBadgeColor(selectedRequest.role_name)"> Calon {{ selectedRequest.role_name }} </span>
                </div>
              </div>
            </div>

            <!-- Detail Spesifik Berdasarkan Role -->
            <div>
              <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-id-card text-gray-400"></i>
                Data Profil {{ selectedRequest.role_name }}
              </h4>

              <div class="grid grid-cols-2 gap-4 text-sm border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <!-- ALUMNI -->
                <template v-if="selectedRequest.role_name === 'Alumni'">
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500">Tahun Lulus</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.tahun_lulus || "-" }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500">Pekerjaan</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.pekerjaan_saat_ini || "-" }}</span>
                  </div>
                  <div class="col-span-2 flex flex-col border-t border-gray-100 pt-2 mt-1">
                    <span class="text-xs text-gray-500">Perusahaan</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.nama_perusahaan || "-" }}</span>
                  </div>
                </template>

                <!-- MITRA -->
                <template v-else-if="selectedRequest.role_name === 'Mitra'">
                  <div class="col-span-2 flex flex-col">
                    <span class="text-xs text-gray-500">Nama Perusahaan</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.nama_perusahaan || "-" }}</span>
                  </div>
                  <div class="flex flex-col border-t border-gray-100 pt-2">
                    <span class="text-xs text-gray-500">Jabatan</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.jabatan || "-" }}</span>
                  </div>
                  <div class="col-span-2 flex flex-col border-t border-gray-100 pt-2">
                    <span class="text-xs text-gray-500">Alamat Kantor</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.alamat_perusahaan || "-" }}</span>
                  </div>
                </template>

                <!-- PAKAR -->
                <template v-else-if="selectedRequest.role_name === 'Pakar'">
                  <div class="col-span-2 flex flex-col">
                    <span class="text-xs text-gray-500">Bidang Keahlian</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.bidang_keahlian || "-" }}</span>
                  </div>
                  <div class="col-span-2 flex flex-col border-t border-gray-100 pt-2">
                    <span class="text-xs text-gray-500">Instansi Asal</span>
                    <span class="font-semibold text-gray-900">{{ selectedRequest.profile_data?.instansi_asal || "-" }}</span>
                  </div>
                </template>

                <!-- Default / Error -->
                <template v-else>
                  <div class="col-span-2 text-center text-gray-400 text-xs italic">Tidak ada data profil spesifik.</div>
                </template>
              </div>
            </div>

            <!-- Requester Info -->
            <div class="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-800">
              <i class="fa-solid fa-info-circle text-blue-500"></i>
              <span>
                Diundang oleh <span class="font-bold">{{ selectedRequest.requester_name }}</span> untuk bergabung ke komunitas <span class="font-bold">{{ selectedRequest.community_name }}</span
                >.
              </span>
            </div>

            <!-- Input Reject (Conditional) -->
            <div v-if="showRejectInput" class="animate-fade-in bg-red-50 p-4 rounded-xl border border-red-200">
              <label class="text-xs font-bold text-red-800 mb-2 block"> Alasan Penolakan <span class="text-red-500">*</span> </label>
              <textarea
                v-model="rejectReason"
                rows="3"
                class="w-full text-sm p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
                placeholder="Tulis alasan mengapa permintaan ini ditolak (akan dikirim ke email pemohon)..."
              ></textarea>
              <div class="flex justify-end mt-3 gap-2">
                <button @click="showRejectInput = false" class="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-800 cursor-pointer">Batal</button>
                <button @click="handleReject" :disabled="isProcessing" class="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition-colors cursor-pointer">
                  <i v-if="isProcessing" class="fa-solid fa-spinner fa-spin mr-1"></i>
                  Kirim Penolakan
                </button>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <!-- Footer hanya muncul jika status PENDING dan sedang tidak input reject -->
          <div v-if="selectedRequest?.status === 'PENDING' && !showRejectInput" class="flex justify-between items-center w-full px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
            <button @click="showDetailDialog = false" class="text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors cursor-pointer">Tutup</button>

            <div class="flex gap-3">
              <button @click="showRejectInput = true" class="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors cursor-pointer">Tolak</button>
              <button
                @click="handleApprove"
                :disabled="isProcessing"
                class="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <i v-if="isProcessing" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-check"></i>
                Setujui &amp; Buat Akun
              </button>
            </div>
          </div>

          <!-- Tombol Tutup Sederhana jika bukan PENDING -->
          <div v-else-if="selectedRequest?.status !== 'PENDING'" class="flex justify-end w-full px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
            <button @click="showDetailDialog = false" class="px-5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">Tutup</button>
          </div>
        </template>
      </Dialog>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
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
</style>
