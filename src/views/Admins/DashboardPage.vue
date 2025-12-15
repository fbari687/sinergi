<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";

// PrimeVue Components
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Chart from "primevue/chart";
import Toast from "primevue/toast";
import Dropdown from "primevue/dropdown";
import { useToast } from "primevue";

// Services
import adminApi from "@/services/adminApi";
import reportApi from "@/services/reportApi";

const router = useRouter();
const toast = useToast();
const loading = ref(false);

// --- FILTERS ---
const selectedPeriod = ref("7_days");
const periodOptions = [
  { label: "7 Hari Terakhir", value: "7_days" },
  { label: "30 Hari Terakhir", value: "30_days" },
  { label: "Bulan Ini", value: "this_month" },
];

const selectedInteractionType = ref("ALL_COMBINED");
const interactionOptions = [
  { label: "Total Gabungan", value: "ALL_COMBINED" },
  { label: "Hanya Postingan", value: "POST" },
  { label: "Hanya Komentar", value: "COMMENT" },
  { label: "Hanya Forum", value: "FORUM" },
  { label: "Hanya Respon", value: "RESPOND" },
];

// --- STATE DATA ---
const kpis = ref({
  total_users: { current: 0, change: null },
  active_users: { current: 0, previous: 0, change: null },
  active_communities: { current: 0, previous: 0, change: null },
  pending_reports: { current: 0, previous: 0, change: null },
});

const activityChart = ref({
  labels: [],
  datasets: [
    {
      label: "Interaksi",
      data: [],
      fill: true,
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.05)",
      tension: 0.4,
      pointRadius: 3,
    },
  ],
});

const roleChart = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"],
      hoverOffset: 4,
    },
  ],
});

// Tables Data
const pendingReports = ref([]);
const accountRequests = ref([]);
const globalLeaderboard = ref([]); // Data Leaderboard Baru

// --- CHART OPTIONS ---
const activityOptions = ref({
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { beginAtZero: true, grid: { borderDash: [4, 4] }, ticks: { font: { size: 10 } } },
  },
});

const roleOptions = ref({
  maintainAspectRatio: false,
  plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8 } } },
});

// --- METHODS ---
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    // 1. Fetch Overview (KPI, Charts, Leaderboard) dengan Parameter
    const resOverview = await adminApi.getDashboardOverview(selectedPeriod.value, selectedInteractionType.value);
    const data = resOverview.data.data;

    // Mapping KPI
    if (data.kpis) kpis.value = data.kpis;

    // Mapping Activity Chart
    if (data.activity_chart) {
      activityChart.value = {
        labels: data.activity_chart.labels,
        datasets: [
          {
            ...activityChart.value.datasets[0],
            data: data.activity_chart.values,
          },
        ],
      };
    }

    // Mapping Role Chart
    if (data.role_activity) {
      roleChart.value = {
        labels: data.role_activity.labels,
        datasets: [
          {
            ...roleChart.value.datasets[0],
            data: data.role_activity.values,
          },
        ],
      };
    }

    // Mapping Lists
    accountRequests.value = data.account_requests_list || [];
    globalLeaderboard.value = data.leaderboard || [];

    // 2. Fetch Pending Reports (Terpisah via reportApi)
    const resReports = await reportApi.getSummary({
      status: "OPEN",
      page: 1,
      per_page: 5,
    });
    pendingReports.value = resReports.data.data.items || [];
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memuat data dashboard", life: 3000 });
  } finally {
    loading.value = false;
  }
};

// Watcher: Reload data jika filter berubah
watch([selectedPeriod, selectedInteractionType], () => {
  fetchDashboardData();
});

// --- ACTIONS ---
const handleApproveRequest = async (request) => {
  if (!confirm(`Setujui pembuatan akun untuk ${request.fullname}?`)) return;
  try {
    await adminApi.approveAccountRequest(request.id);
    toast.add({ severity: "success", summary: "Berhasil", detail: `Akun ${request.fullname} disetujui`, life: 3000 });
    fetchDashboardData();
  } catch (error) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal menyetujui permintaan", life: 3000 });
  }
};

const handleRejectRequest = async (request) => {
  const reason = prompt("Masukkan alasan penolakan:");
  if (reason === null) return;
  try {
    await adminApi.rejectAccountRequest(request.id, reason);
    toast.add({ severity: "info", summary: "Ditolak", detail: `Permintaan ${request.fullname} ditolak`, life: 3000 });
    fetchDashboardData();
  } catch (error) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal menolak permintaan", life: 3000 });
  }
};

const navigateToReportDetail = () => {
  router.push("/admin/reports");
};

// --- HELPERS ---
const trendClass = (val, isPositiveGood = true) => {
  if (val === null) return "bg-gray-100 text-gray-500";
  if (val > 0) return isPositiveGood ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700";
  if (val < 0) return isPositiveGood ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700";
  return "bg-gray-100 text-gray-600";
};

const formatTrend = (val) => {
  const abs = Math.abs(val || 0).toFixed(1);
  return (val > 0 ? "+" : val < 0 ? "-" : "") + abs + "%";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Lifecycle
onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <LayoutAdminUser :useNavbar="true" :useSidebar="true">
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 pb-12">
      <Toast />

      <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p class="text-sm text-gray-500 mt-1">Ringkasan aktivitas platform SINERGI dan pertumbuhan ekosistem.</p>
        </div>

        <div class="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <div class="px-2 text-gray-400"><i class="pi pi-calendar"></i></div>
          <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="w-40 text-sm border-none shadow-none" />
          <Button icon="pi pi-refresh" rounded text aria-label="Refresh" @click="fetchDashboardData" :loading="loading" />
        </div>
      </div>

      <div v-if="loading && !kpis.total_users.current" class="flex justify-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
      </div>

      <div v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Laporan Pending</p>
                <h3 class="text-3xl font-bold text-gray-900">{{ kpis.pending_reports.current }}</h3>
              </div>
              <div class="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                <i class="pi pi-flag text-lg"></i>
              </div>
            </div>
            <div class="relative z-10 mt-4 flex items-center gap-2 text-xs">
              <span class="px-1.5 py-0.5 rounded font-medium" :class="kpis.pending_reports.change > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                {{ formatTrend(kpis.pending_reports.change) }}
              </span>
              <span class="text-gray-400">vs periode lalu</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Total Pengguna</p>
                <h3 class="text-3xl font-bold text-gray-900">{{ kpis.total_users.current.toLocaleString("id-ID") }}</h3>
              </div>
              <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                <i class="pi pi-users text-lg"></i>
              </div>
            </div>
            <div class="relative z-10 mt-4 flex items-center gap-2 text-xs">
              <span class="text-gray-400">Total terdaftar</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">User Aktif</p>
                <h3 class="text-3xl font-bold text-gray-900">{{ kpis.active_users.current.toLocaleString("id-ID") }}</h3>
              </div>
              <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <i class="pi pi-chart-line text-lg"></i>
              </div>
            </div>
            <div class="relative z-10 mt-4 flex items-center gap-2 text-xs">
              <span class="px-1.5 py-0.5 rounded font-medium" :class="trendClass(kpis.active_users.change, true)">
                {{ formatTrend(kpis.active_users.change) }}
              </span>
              <span class="text-gray-400">vs periode lalu</span>
            </div>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div class="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div class="relative z-10 flex justify-between items-start">
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">Komunitas Aktif</p>
                <h3 class="text-3xl font-bold text-gray-900">{{ kpis.active_communities.current }}</h3>
              </div>
              <div class="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <i class="pi pi-building text-lg"></i>
              </div>
            </div>
            <div class="relative z-10 mt-4 flex items-center gap-2 text-xs">
              <span class="px-1.5 py-0.5 rounded font-medium" :class="trendClass(kpis.active_communities.change, true)">
                {{ formatTrend(kpis.active_communities.change) }}
              </span>
              <span class="text-gray-400">vs periode lalu</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 class="text-lg font-bold text-gray-800">Tren Aktivitas</h2>
                <p class="text-xs text-gray-500">Jumlah interaksi harian.</p>
              </div>
              <Dropdown v-model="selectedInteractionType" :options="interactionOptions" optionLabel="label" optionValue="value" class="w-full sm:w-48 text-sm" />
            </div>
            <div class="h-[300px] w-full">
              <Chart type="line" :data="activityChart" :options="activityOptions" class="h-full w-full" />
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-bold text-gray-800">Demografi Aktivitas</h2>
                <p class="text-xs text-gray-500">Kontribusi konten berdasarkan role (All Time).</p>
              </div>
              <div class="p-2 bg-gray-50 rounded-lg">
                <i class="pi pi-chart-pie text-gray-400"></i>
              </div>
            </div>
            <div class="h-[300px] w-full flex items-center justify-center">
              <Chart type="doughnut" :data="roleChart" :options="roleOptions" class="h-full w-full" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div class="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <div class="w-2 h-6 bg-yellow-400 rounded-full"></div>
                <h2 class="font-bold text-gray-800">Top Kontributor Global</h2>
              </div>
              <RouterLink to="/admin/leaderboard" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"> Lihat Selengkapnya <i class="pi pi-arrow-right text-[10px]"></i> </RouterLink>
            </div>
            <div class="p-1 grow">
              <DataTable :value="globalLeaderboard" :rows="5" size="small" stripedRows responsiveLayout="scroll" class="text-sm">
                <template #empty>
                  <div class="text-center py-6 text-gray-400 text-xs">Belum ada aktivitas.</div>
                </template>

                <Column header="#" style="width: 3rem" class="text-center font-bold text-gray-400">
                  <template #body="slotProps">{{ slotProps.index + 1 }}</template>
                </Column>
                <Column header="User">
                  <template #body="slotProps">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        <img :src="slotProps.data.profile_picture || 'https://ui-avatars.com/api/?name=' + slotProps.data.fullname" class="w-full h-full object-cover" />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs font-bold text-gray-900">{{ slotProps.data.fullname }}</span>
                        <span class="text-[10px] text-gray-500">{{ slotProps.data.role_name }}</span>
                      </div>
                    </div>
                  </template>
                </Column>
                <Column field="posts" header="P" class="text-center w-10 text-gray-500" headerTooltip="Posts"></Column>
                <Column field="comments" header="C" class="text-center w-10 text-gray-500" headerTooltip="Comments"></Column>
                <Column field="forums" header="F" class="text-center w-10 text-gray-500" headerTooltip="Forums"></Column>
                <Column field="responds" header="R" class="text-center w-10 text-gray-500" headerTooltip="Responds"></Column>
                <Column field="total_interactions" header="Total" class="text-center w-16">
                  <template #body="slotProps">
                    <span class="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{{ slotProps.data.total_interactions }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div class="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <div class="w-2 h-6 bg-red-500 rounded-full"></div>
                <h2 class="font-bold text-gray-800">Laporan Konten Baru</h2>
              </div>
              <Tag :value="pendingReports.length + ' Open'" severity="danger" rounded></Tag>
            </div>
            <div class="p-1 grow">
              <DataTable :value="pendingReports" :rows="5" size="small" stripedRows responsiveLayout="scroll" class="text-sm">
                <template #empty>
                  <div class="text-center py-6 text-gray-400 text-xs">Aman, tidak ada laporan.</div>
                </template>
                <Column field="last_report_at" header="Waktu" style="width: 25%">
                  <template #body="slotProps">
                    <span class="text-xs font-medium text-gray-600 block">{{ formatDateTime(slotProps.data.last_report_at).split(",")[0] }}</span>
                    <span class="text-[10px] text-gray-400 block">{{ formatDateTime(slotProps.data.last_report_at).split(",")[1] }}</span>
                  </template>
                </Column>
                <Column field="reportable_type" header="Tipe">
                  <template #body="slotProps">
                    <span class="text-[10px] font-bold uppercase bg-gray-100 px-1 rounded">{{ slotProps.data.reportable_type }}</span>
                  </template>
                </Column>
                <Column header="Target" style="width: 40%">
                  <template #body="slotProps">
                    <span class="text-xs line-clamp-1" :title="stripHtml(slotProps.data.target_preview?.label)">
                      {{ stripHtml(slotProps.data.target_preview?.label || "Konten") }}
                    </span>
                  </template>
                </Column>
                <Column header="" style="width: 10%">
                  <template #body="slotProps">
                    <Button icon="pi pi-arrow-right" text rounded size="small" @click="navigateToReportDetail(slotProps.data)" />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div class="p-2 border-t border-gray-100 text-center">
              <RouterLink to="/admin/reports" class="text-xs text-blue-600 hover:underline">Lihat Semua</RouterLink>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
          <div class="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div class="flex items-center gap-2">
              <div class="w-2 h-6 bg-blue-500 rounded-full"></div>
              <h2 class="font-bold text-gray-800">Permintaan Akun Eksternal</h2>
            </div>
            <Tag :value="accountRequests.length + ' Request'" severity="info" rounded></Tag>
          </div>

          <div class="p-1 grow">
            <DataTable :value="accountRequests" :rows="5" paginator size="small" stripedRows responsiveLayout="scroll" class="text-sm">
              <template #empty>
                <div class="text-center py-8 text-gray-400 text-sm">Tidak ada permintaan akun.</div>
              </template>

              <Column field="fullname" header="Pemohon">
                <template #body="slotProps">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                      {{ slotProps.data.fullname.charAt(0).toUpperCase() }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-gray-900">{{ slotProps.data.fullname }}</span>
                      <span class="text-[10px] text-gray-500">{{ slotProps.data.email }}</span>
                    </div>
                  </div>
                </template>
              </Column>

              <Column field="role_name" header="Role" style="width: 15%">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.role_name" severity="success" class="text-[10px]" />
                </template>
              </Column>

              <Column field="community_name" header="Komunitas" style="width: 25%">
                <template #body="slotProps">
                  <span class="text-xs text-gray-600 flex items-center gap-1">
                    <i class="pi pi-users text-gray-300"></i>
                    <span class="truncate max-w-[120px]" :title="slotProps.data.community_name">{{ slotProps.data.community_name }}</span>
                  </span>
                </template>
              </Column>

              <Column header="Aksi" style="width: 20%" class="text-center">
                <template #body="slotProps">
                  <div v-if="slotProps.data.status === 'PENDING'" class="flex justify-center gap-1">
                    <Button icon="pi pi-check" rounded text severity="success" size="small" @click="handleApproveRequest(slotProps.data)" v-tooltip.top="'Setujui'" />
                    <Button icon="pi pi-times" rounded text severity="danger" size="small" @click="handleRejectRequest(slotProps.data)" v-tooltip.top="'Tolak'" />
                  </div>
                  <span v-else class="text-[10px] font-bold text-gray-400">{{ slotProps.data.status }}</span>
                </template>
              </Column>
            </DataTable>
          </div>

          <div class="p-3 border-t border-gray-100 text-center">
            <RouterLink to="/admin/account-requests" class="text-xs text-blue-600 hover:underline font-medium">Lihat Semua Permintaan</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
:deep(.p-dropdown-label) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
:deep(.p-paginator) {
  padding: 0.5rem;
  font-size: 0.8rem;
}
:deep(.p-paginator-page.p-highlight) {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: bold;
}
:deep(.p-paginator-page) {
  min-width: 2rem;
  height: 2rem;
  border-radius: 999px;
}
</style>
