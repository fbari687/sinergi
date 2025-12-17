<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue";
import Dialog from "primevue/dialog";
import Paginator from "primevue/paginator";
import reportApi from "@/services/reportApi";

// --- IMPORT POST (YANG SUDAH ADA) ---
import postApi from "@/services/postApi";
import PostReadOnlyContent from "@/components/Posts/PostReadOnlyContent.vue";

// --- IMPORT BARU: FORUM ---
import forumApi from "@/services/forumApi"; // Pastikan service ini ada
import ForumReadOnlyContent from "@/components/Forums/ForumReadOnlyContent.vue";
import { RouterLink } from "vue-router";

const toast = useToast();

// STATE
const reports = ref([]);
const loading = ref(false);

const page = ref(1);
const perPage = ref(10);
const total = ref(0);

const selectedStatus = ref("OPEN");
const searchQuery = ref("");

// Detail modal (Laporan)
const showDetailDialog = ref(false);
const detailLoading = ref(false);
const selectedSummary = ref(null);
const detailReports = ref([]);
const detailTarget = ref(null);
const isActionLoading = ref(false);

// --- STATE: Dialog Full Post ---
const showPostDialog = ref(false);
const isFetchingPost = ref(false);
const fullPostData = ref(null);

// --- STATE BARU: Dialog Full Forum ---
const showForumDialog = ref(false);
const isFetchingForum = ref(false);
const fullForumData = ref(null);

const statusOptions = [
  { label: "Open", value: "OPEN" },
  { label: "In Review", value: "IN_REVIEW" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Ignored", value: "IGNORED" },
  { label: "Semua", value: "ALL" },
];

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

// Fetch summary
const fetchReports = async () => {
  loading.value = true;
  try {
    const res = await reportApi.getSummary({
      status: selectedStatus.value,
      page: page.value,
      per_page: perPage.value,
    });

    const data = res.data.data;
    reports.value = data.items || [];
    total.value = data.total || 0;
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Gagal memuat data laporan.",
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(fetchReports);

// Search client-side
const filteredReports = computed(() => {
  const q = searchQuery.value.toLowerCase();
  if (!q) return reports.value;

  return reports.value.filter((item) => {
    const label = item.target_preview?.label?.toLowerCase() || "";
    const typeLabel = item.target_preview?.type_label?.toLowerCase() || "";
    return label.includes(q) || typeLabel.includes(q);
  });
});

const statusBadgeClass = (status) => {
  switch (status) {
    case "OPEN":
      return "bg-red-50 text-red-700 border-red-300";
    case "IN_REVIEW":
      return "bg-yellow-50 text-yellow-700 border-yellow-300";
    case "RESOLVED":
      return "bg-green-50 text-green-700 border-green-300";
    case "IGNORED":
      return "bg-gray-100 text-gray-600 border-gray-300";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
};

const onPageChange = (event) => {
  page.value = event.page + 1;
  perPage.value = event.rows;
  fetchReports();
};

const onStatusChange = (value) => {
  selectedStatus.value = value;
  page.value = 1;
  fetchReports();
};

// Detail
const openDetail = async (summaryItem) => {
  selectedSummary.value = summaryItem;
  showDetailDialog.value = true;
  detailLoading.value = true;
  detailReports.value = [];
  detailTarget.value = summaryItem.target_preview || null;

  try {
    const res = await reportApi.getDetail(summaryItem.reportable_type, summaryItem.reportable_id);
    const data = res.data.data;
    detailReports.value = data.reports || [];
    if (data.target_preview) {
      detailTarget.value = data.target_preview;
    }
  } catch (err) {
    console.error(err);
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Gagal memuat detail laporan.",
      life: 4000,
    });
  } finally {
    detailLoading.value = false;
  }
};

// --- FUNGSI: Buka Dialog POST ---
const openFullPostContent = async () => {
  const postId = selectedSummary.value?.reportable_id;
  if (!postId) {
    toast.add({ severity: "warn", summary: "Error", detail: "ID Postingan tidak ditemukan", life: 3000 });
    return;
  }

  isFetchingPost.value = true;
  try {
    const response = await postApi.getPostById(postId);
    fullPostData.value = response.data.data;
    showPostDialog.value = true;
  } catch (err) {
    console.error("Gagal memuat postingan:", err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Postingan tidak ditemukan.", life: 3000 });
  } finally {
    isFetchingPost.value = false;
  }
};

// --- FUNGSI BARU: Buka Dialog FORUM ---
const openFullForumContent = async () => {
  const forumId = selectedSummary.value?.reportable_id;
  if (!forumId) {
    toast.add({ severity: "warn", summary: "Error", detail: "ID Forum tidak ditemukan", life: 3000 });
    return;
  }

  isFetchingForum.value = true;
  try {
    // ASUMSI: Anda memiliki endpoint untuk getForumById.
    // Jika endpoint forumApi.getForumDetail butuh slug, Anda mungkin perlu endpoint khusus admin getById
    // atau gunakan endpoint detail yang sudah ada jika support ID saja.
    const response = await forumApi.getForumById(forumId);

    fullForumData.value = response.data.data;
    showForumDialog.value = true;
  } catch (err) {
    console.error("Gagal memuat forum:", err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Forum tidak ditemukan atau sudah dihapus.", life: 3000 });
  } finally {
    isFetchingForum.value = false;
  }
};

const applyStatus = async (status) => {
  if (!selectedSummary.value) return;
  isActionLoading.value = true;
  try {
    await reportApi.updateStatus(selectedSummary.value.reportable_type, selectedSummary.value.reportable_id, status);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Status laporan diperbarui.", life: 3000 });
    showDetailDialog.value = false;
    fetchReports();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memperbarui status.", life: 4000 });
  } finally {
    isActionLoading.value = false;
  }
};

const deleteContent = async () => {
  if (!selectedSummary.value) return;
  if (!confirm("Yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.")) {
    return;
  }

  isActionLoading.value = true;
  try {
    await reportApi.deleteTarget(selectedSummary.value.reportable_type, selectedSummary.value.reportable_id);
    toast.add({ severity: "success", summary: "Konten dihapus", detail: "Konten telah dihapus dan laporan selesai.", life: 4000 });

    showDetailDialog.value = false;
    showPostDialog.value = false;
    showForumDialog.value = false; // Tutup dialog forum juga

    fetchReports();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus konten.", life: 4000 });
  } finally {
    isActionLoading.value = false;
  }
};
</script>

<template>
  <LayoutAdminUser>
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Kelola Laporan</h1>
          <p class="text-sm text-gray-500 mt-1">Pantau dan tindak lanjuti laporan konten yang dibuat oleh pengguna.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-600 flex justify-between items-center transition-transform hover:scale-[1.01]">
          <div>
            <p class="text-sm font-semibold text-gray-500">Total Target Dilaporkan</p>
            <h2 class="text-3xl font-extrabold text-gray-900 mt-1">{{ total }}</h2>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
            <i class="fa-solid fa-file-shield text-xl"></i>
          </div>
        </div>

        <div class="lg:col-span-3 flex flex-col justify-center gap-2 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Filter Status Laporan</span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="onStatusChange(opt.value)"
              class="px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-200 shadow-sm"
              :class="selectedStatus === opt.value ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-end">
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <i class="fas fa-search text-gray-400"></i>
          </span>
          <input v-model="searchQuery" type="text" class="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition" placeholder="Cari judul konten..." />
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div v-if="loading" class="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
          <p class="font-medium animate-pulse">Memuat data laporan...</p>
        </div>

        <div v-else>
          <table class="w-full text-sm text-left text-gray-600">
            <thead class="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 font-bold tracking-wider">Target Konten</th>
                <th class="px-6 py-4 font-bold tracking-wider text-center">Total Laporan</th>
                <th class="px-6 py-4 font-bold tracking-wider">Terakhir Dilaporkan</th>
                <th class="px-6 py-4 font-bold tracking-wider">Status</th>
                <th class="px-6 py-4 font-bold tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in filteredReports" :key="item.reportable_type + '-' + item.reportable_id" class="hover:bg-blue-50/40 transition-colors duration-150">
                <td class="px-6 py-4">
                  <div class="flex items-start gap-4">
                    <div class="shrink-0 relative group">
                      <img v-if="item.target_preview?.thumbnail" :src="item.target_preview.thumbnail" alt="thumb" class="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm" />
                      <div v-else class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400">
                        <i class="fa-solid fa-image"></i>
                      </div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-0.5">
                        {{ item.target_preview?.type_label || item.reportable_type }}
                      </span>
                      <p class="text-gray-900 font-bold text-sm line-clamp-2 max-w-[200px] leading-snug">
                        {{ item.target_preview?.label || "—" }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 font-bold text-sm border border-gray-200">{{ item.total_reports }}</span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-500 whitespace-nowrap font-medium">
                  <div class="flex items-center gap-2">
                    <i class="fa-regular fa-clock"></i>
                    {{ formatDateTime(item.last_report_at) }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border shadow-sm" :class="statusBadgeClass(item.status)">
                    <i
                      class="fa-solid fa-circle text-[6px] mr-2 animate-pulse"
                      :class="{ 'text-red-500': item.status === 'OPEN', 'text-yellow-500': item.status === 'IN_REVIEW', 'text-green-500': item.status === 'RESOLVED', 'text-gray-500': item.status === 'IGNORED' }"
                    ></i>
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <button
                    class="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-lg transition-all shadow-sm border border-blue-100 cursor-pointer"
                    @click="openDetail(item)"
                  >
                    <i class="fas fa-eye"></i> Tinjau
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredReports.length && !loading">
                <td colspan="5" class="px-6 py-16 text-center">
                  <div class="flex flex-col items-center gap-4 text-gray-400">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                      <i class="fas fa-check-circle text-4xl text-gray-300"></i>
                    </div>
                    <p class="text-base font-medium text-gray-500">Tidak ada laporan dengan status ini.</p>
                    <p class="text-xs">Ubah filter status untuk melihat data lain.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="border-t border-gray-100 px-4 py-3 bg-gray-50/50 flex justify-end">
            <Paginator :rows="perPage" :totalRecords="total" :first="(page - 1) * perPage" :rowsPerPageOptions="[5, 10, 20, 50]" @page="onPageChange" />
          </div>
        </div>
      </div>

      <Dialog
        v-model:visible="showDetailDialog"
        modal
        :style="{ width: '700px' }"
        header="Detail Laporan Konten"
        :draggable="false"
        :pt="{ root: { class: 'rounded-xl shadow-2xl border-0' }, header: { class: 'bg-white border-b border-gray-100 pb-3 rounded-t-xl' }, content: { class: 'p-0' } }"
      >
        <div class="p-6">
          <div v-if="detailLoading" class="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mb-2"></i>
            <span class="text-sm font-medium">Memuat detail laporan...</span>
          </div>

          <div v-else-if="detailTarget" class="flex flex-col gap-6">
            <div class="bg-linear-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 flex gap-5 items-start shadow-sm relative overflow-hidden">
              <div class="absolute top-0 right-0 w-20 h-20 bg-gray-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
              <div class="shrink-0 relative z-10">
                <img v-if="detailTarget?.thumbnail" :src="detailTarget.thumbnail" alt="target-image" class="w-20 h-20 rounded-xl object-cover border border-white shadow-md" />
                <div v-else class="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center border border-white shadow-md text-gray-400">
                  <i class="fa-solid fa-image text-2xl"></i>
                </div>
              </div>
              <div class="flex-1 flex flex-col justify-center z-10">
                <div class="flex justify-between items-start">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 mb-1">
                    {{ detailTarget.type_label || selectedSummary?.reportable_type }}
                  </span>
                  <div class="text-right">
                    <span class="text-xs text-gray-500">ID: {{ selectedSummary?.reportable_id }}</span>
                  </div>
                </div>
                <h3 class="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                  {{ detailTarget.label || "Konten Tidak Tersedia" }}
                </h3>
                <div class="mt-2 flex items-center gap-2">
                  <span class="text-xs font-semibold text-gray-500">Total Laporan:</span>
                  <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">{{ selectedSummary?.total_reports }}</span>
                </div>

                <div v-if="detailTarget.type_label === 'Post' || selectedSummary?.reportable_type === 'Post'" class="mt-3">
                  <button @click="openFullPostContent" :disabled="isFetchingPost" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                    <i v-if="isFetchingPost" class="fa-solid fa-circle-notch fa-spin"></i>
                    <i v-else class="fa-solid fa-external-link-alt"></i>
                    <span>{{ isFetchingPost ? "Memuat Postingan..." : "Lihat Postingan Lengkap" }}</span>
                  </button>
                </div>

                <div v-if="detailTarget.type_label === 'Forum Diskusi' || selectedSummary?.reportable_type === 'FORUM'" class="mt-3">
                  <button @click="openFullForumContent" :disabled="isFetchingForum" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                    <i v-if="isFetchingForum" class="fa-solid fa-circle-notch fa-spin"></i>
                    <i v-else class="fa-solid fa-external-link-alt"></i>
                    <span>{{ isFetchingForum ? "Memuat Forum..." : "Lihat Forum Lengkap" }}</span>
                  </button>
                </div>
                <div v-if="detailTarget.type_label === 'Komunitas' || selectedSummary?.reportable_type === 'COMMUNITY'" class="mt-3">
                  <RouterLink :to="`/admin/communities/${detailTarget?.slug}`" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-wait">
                    <i class="fa-solid fa-external-link-alt"></i>
                    <span>Lihat Komunitas</span>
                  </RouterLink>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><i class="fa-solid fa-list-ul text-gray-400"></i> Daftar Pelapor</h4>
              <div class="max-h-72 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                <div v-for="r in detailReports" :key="r.id" class="border border-gray-200 rounded-xl p-4 bg-white hover:border-blue-300 hover:shadow-sm transition-all">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs"><i class="fa-solid fa-user"></i></div>
                      <div>
                        <p class="text-sm font-bold text-gray-800 leading-none">{{ r.fullname }}</p>
                        <p class="text-[10px] text-gray-500">@{{ r.username }}</p>
                      </div>
                    </div>
                    <span class="text-[10px] px-2 py-1 rounded-md bg-red-50 text-red-700 font-bold border border-red-100">{{ r.violation_type }}</span>
                  </div>
                  <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 relative">
                    <i class="fa-solid fa-quote-left absolute top-2 left-2 text-gray-200 text-xl z-0"></i>
                    <p class="relative z-10 whitespace-pre-line pl-1">{{ r.reason || "Tidak ada keterangan tambahan." }}</p>
                  </div>
                  <div class="mt-2 text-right">
                    <span class="text-[10px] text-gray-400"><i class="fa-regular fa-calendar mr-1"></i> {{ formatDateTime(r.created_at) }}</span>
                  </div>
                </div>
                <div v-if="!detailReports.length" class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                  <p class="text-sm text-gray-400">Data detail laporan tidak ditemukan.</p>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:justify-between items-center gap-4">
              <div class="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span class="font-semibold">Status Saat Ini:</span>
                <span
                  class="font-bold"
                  :class="{
                    'text-red-600': selectedSummary?.status === 'OPEN',
                    'text-yellow-600': selectedSummary?.status === 'IN_REVIEW',
                    'text-green-600': selectedSummary?.status === 'RESOLVED',
                    'text-gray-600': selectedSummary?.status === 'IGNORED',
                  }"
                  >{{ selectedSummary?.status }}</span
                >
              </div>
              <div class="flex flex-wrap gap-2 justify-end">
                <button
                  @click="applyStatus('IGNORED')"
                  :disabled="isActionLoading || selectedSummary?.status === 'IGNORED'"
                  class="px-4 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm cursor-pointer"
                >
                  Abaikan
                </button>
                <button
                  @click="applyStatus('IN_REVIEW')"
                  :disabled="isActionLoading || selectedSummary?.status === 'IN_REVIEW'"
                  class="px-4 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200 cursor-pointer"
                >
                  Tinjau
                </button>
                <button
                  @click="applyStatus('RESOLVED')"
                  :disabled="isActionLoading || selectedSummary?.status === 'RESOLVED'"
                  class="px-4 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 cursor-pointer"
                >
                  Selesai
                </button>
                <div class="w-px h-8 bg-gray-300 mx-1"></div>
                <button
                  @click="deleteContent"
                  :disabled="isActionLoading"
                  class="px-4 py-2 text-xs rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg border border-transparent cursor-pointer"
                >
                  <i v-if="isActionLoading" class="fa-solid fa-spinner fa-spin mr-1"></i> Hapus Konten
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        v-model:visible="showPostDialog"
        modal
        :header="'Tinjauan Postingan: ' + (fullPostData?.user?.username || 'User')"
        :style="{ width: '600px' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        :draggable="false"
        dismissableMask
      >
        <div v-if="fullPostData" class="p-1">
          <PostReadOnlyContent :post="fullPostData" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2 pt-2">
            <button @click="showPostDialog = false" class="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Tutup</button>
            <button
              @click="
                deleteContent();
                showPostDialog = false;
              "
              class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Hapus Postingan Ini
            </button>
          </div>
        </template>
      </Dialog>

      <Dialog v-model:visible="showForumDialog" modal :header="'Tinjauan Forum Diskusi'" :style="{ width: '800px' }" :breakpoints="{ '1199px': '85vw', '575px': '95vw' }" :draggable="false" dismissableMask>
        <div v-if="fullForumData" class="p-1">
          <ForumReadOnlyContent :forum="fullForumData" />
        </div>
        <template #footer>
          <div class="flex justify-end gap-2 pt-2">
            <button @click="showForumDialog = false" class="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Tutup</button>
            <button
              @click="
                deleteContent();
                showForumDialog = false;
              "
              class="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
            >
              Hapus Topik Ini
            </button>
          </div>
        </template>
      </Dialog>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
/* (STYLE SAMA SEPERTI SEBELUMNYA) */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
:deep(.p-paginator) {
  background-color: transparent !important;
  padding: 0 !important;
}
:deep(.p-paginator-page),
:deep(.p-paginator-next),
:deep(.p-paginator-prev),
:deep(.p-paginator-first),
:deep(.p-paginator-last) {
  font-size: 12px !important;
  min-width: 32px !important;
  height: 2rem !important;
  border-radius: 8px !important;
}
:deep(.p-paginator-page.p-highlight) {
  background-color: #eff6ff !important;
  color: #155dfc !important;
  border: 1px solid #dbeafe !important;
}
</style>
