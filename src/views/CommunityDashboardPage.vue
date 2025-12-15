<script setup>
import { ref, onMounted, computed, watch } from "vue";
import communityApi from "@/services/communityApi"; // Import API
import { useToast } from "primevue"; // Import Toast untuk error handling

// PrimeVue Components
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Chart from "primevue/chart";
import Dropdown from "primevue/dropdown";

// PROPS: Menerima object community dari Parent (Wrapper)
const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});

const toast = useToast();

// --- STATE VARIABLES ---
const loading = ref(false);

// 1. FILTER WAKTU & TIPE INTERAKSI
const selectedPeriod = ref("7_days");
const periodOptions = [
  { label: "7 Hari Terakhir", value: "7_days" },
  { label: "30 Hari Terakhir", value: "30_days" },
  { label: "Bulan Ini", value: "this_month" },
];

const selectedInteractionType = ref("ALL_COMBINED");
const interactionOptions = [
  { label: "Total Gabungan (Semua)", value: "ALL_COMBINED" },
  { label: "Mode Detail (Semua Grafik)", value: "ALL_DETAILED" },
  { label: "Hanya Postingan", value: "POST" },
  { label: "Hanya Forum Diskusi", value: "FORUM" },
  { label: "Hanya Komentar Post", value: "COMMENT" },
  { label: "Hanya Respon Forum", value: "RESPOND" },
];

const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// 2. STATE DATA (Reaktif terhadap API)
const rawChartData = ref({
  labels: [],
  posts: [],
  forums: [],
  comments: [],
  responds: [],
});

// KPI Cards (Default 0 agar tidak error saat loading awal)
const kpis = ref({
  total_members: { current: 0, change: 0 },
  interactions: { current: 0, change: 0 },
  pending_requests: { current: 0, change: 0 },
  inactive_members: { current: 0, change: 0 },
});

const popularTopics = ref([]);
const contributors = ref([]);
const inactiveMembers = ref([]);

// 3. LOGIKA CHART (COMPUTED)
const activityChart = computed(() => {
  const labels = rawChartData.value.labels || [];
  const posts = rawChartData.value.posts || [];
  const forums = rawChartData.value.forums || [];
  const comments = rawChartData.value.comments || [];
  const responds = rawChartData.value.responds || [];

  let datasets = [];

  // Helper function untuk generate dataset agar kode rapi
  const createDataset = (label, data, color, bgColor) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: bgColor,
    fill: !!bgColor,
    tension: 0.4,
  });

  switch (selectedInteractionType.value) {
    case "ALL_COMBINED":
      const totalActivity = posts.map((num, idx) => {
        return (num || 0) + (forums[idx] || 0) + (comments[idx] || 0) + (responds[idx] || 0);
      });
      datasets.push(createDataset("Total Interaksi", totalActivity, "#6366f1", "rgba(99, 102, 241, 0.1)"));
      break;

    case "ALL_DETAILED":
      datasets = [createDataset("Post", posts, "#3b82f6", null), createDataset("Forum", forums, "#10b981", null), createDataset("Komentar", comments, "#f59e0b", null), createDataset("Respon", responds, "#8b5cf6", null)];
      break;

    case "POST":
      datasets.push(createDataset("Postingan", posts, "#3b82f6", "rgba(59, 130, 246, 0.1)"));
      break;

    case "FORUM":
      datasets.push(createDataset("Forum", forums, "#10b981", "rgba(16, 185, 129, 0.1)"));
      break;

    case "COMMENT":
      datasets.push(createDataset("Komentar", comments, "#f59e0b", "rgba(245, 158, 11, 0.1)"));
      break;

    case "RESPOND":
      datasets.push(createDataset("Respon Forum", responds, "#8b5cf6", "rgba(139, 92, 246, 0.1)"));
      break;
  }

  return { labels, datasets };
});

const activityOptions = ref({
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "top" },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { beginAtZero: true, grid: { borderDash: [4, 4] }, ticks: { font: { size: 10 } } },
  },
});

// Role Chart (Doughnut) - Data akan diisi dari API
const roleChart = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#64748b"], // Warna Preset
      hoverOffset: 4,
    },
  ],
});

const roleOptions = ref({
  maintainAspectRatio: false,
  plugins: { legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8 } } },
});

// --- METHODS ---
const fetchDashboardData = async () => {
  if (!props.community?.slug) return;

  loading.value = true;
  try {
    const response = await communityApi.getDashboardMetrics(props.community.slug, selectedPeriod.value);
    const data = response.data.data;

    // 1. Set KPIs
    kpis.value = data.kpis;

    // 2. Set Activity Chart Data
    rawChartData.value = {
      labels: data.charts.activity.labels,
      posts: data.charts.activity.posts,
      forums: data.charts.activity.forums,
      comments: data.charts.activity.comments,
      responds: data.charts.activity.responds,
    };

    // 3. Set Role Chart Data
    roleChart.value = {
      labels: data.charts.roles.labels, // Contoh: ["Mahasiswa", "Dosen"]
      datasets: [
        {
          data: data.charts.roles.data, // Contoh: [50, 5]
          backgroundColor: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#64748b"],
          hoverOffset: 4,
        },
      ],
    };

    // 4. Set Tables
    popularTopics.value = data.popular_topics;
    contributors.value = data.top_contributors;
    inactiveMembers.value = data.inactive_members;
  } catch (error) {
    console.error("Gagal memuat dashboard:", error);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat data dashboard." });
  } finally {
    loading.value = false;
  }
};

// Watcher: Jika periode berubah, fetch data baru
watch(selectedPeriod, () => {
  fetchDashboardData();
});

// Helper Formatter
const formatTrend = (val) => {
  if (val === null || val === undefined) return "-";
  return (val > 0 ? "+" : "") + Math.abs(val).toFixed(1) + "%";
};

const trendClass = (val) => {
  if (val === null || val === undefined) return "text-gray-500 bg-gray-100";
  return val > 0 ? "text-emerald-700 bg-emerald-100" : "text-red-700 bg-red-100";
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="w-full max-w-full p-6 space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Komunitas</h1>
        <p class="text-sm text-gray-500 mt-1">Pantau kesehatan dan aktivitas komunitas Anda secara real-time.</p>
      </div>

      <div class="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-2 px-2">
          <i class="pi pi-calendar text-gray-400"></i>
          <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="w-40 text-sm border-none shadow-none" />
        </div>
        <Button icon="pi pi-refresh" rounded text aria-label="Refresh" @click="fetchDashboardData" :loading="loading" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div class="flex justify-between items-start z-10 relative">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Anggota</p>
              <h3 class="text-2xl font-bold text-gray-900">{{ kpis.total_members?.current || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <i class="pi pi-users text-lg"></i>
            </div>
          </div>
          <div class="relative z-10 mt-3 flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700"> {{ kpis.total_members?.change > 0 ? "+" : "" }}{{ kpis.total_members?.change }} Baru </span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div class="flex justify-between items-start z-10 relative">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Interaksi</p>
              <h3 class="text-2xl font-bold text-gray-900">{{ kpis.interactions?.current || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <i class="pi pi-chart-line text-lg"></i>
            </div>
          </div>
          <div class="relative z-10 mt-3 flex items-center gap-2 text-xs">
            <span class="px-1.5 py-0.5 rounded font-medium" :class="trendClass(kpis.interactions?.change)">
              {{ formatTrend(kpis.interactions?.change) }}
            </span>
            <span class="text-gray-400">vs periode lalu</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div class="flex justify-between items-start z-10 relative">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Request Join</p>
              <h3 class="text-2xl font-bold text-gray-900">{{ kpis.pending_requests?.current || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i class="pi pi-user-plus text-lg"></i>
            </div>
          </div>
          <div class="relative z-10 mt-3 text-xs text-gray-500">Menunggu persetujuan</div>
        </div>

        <!-- <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div class="flex justify-between items-start z-10 relative">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pasif > 30 Hari</p>
              <h3 class="text-2xl font-bold text-gray-900">{{ kpis.inactive_members?.current || 0 }}</h3>
            </div>
            <div class="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
              <i class="pi pi-user-minus text-lg"></i>
            </div>
          </div>
          <div class="relative z-10 mt-3 text-xs text-gray-500">Perlu atensi admin</div>
        </div> -->
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 class="text-lg font-bold text-gray-800">Tren Aktivitas</h2>
              <p class="text-xs text-gray-500">Analisis pertumbuhan konten dan diskusi</p>
            </div>
            <Dropdown v-model="selectedInteractionType" :options="interactionOptions" optionLabel="label" optionValue="value" class="w-full sm:w-56 text-sm" />
          </div>

          <div class="h-80 w-full">
            <Chart type="line" :data="activityChart" :options="activityOptions" class="h-full w-full" />
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="mb-6">
            <h2 class="text-lg font-bold text-gray-800">Sebaran Role</h2>
            <p class="text-xs text-gray-500">Komposisi anggota komunitas</p>
          </div>
          <div class="h-[300px] w-full flex items-center justify-center">
            <Chart type="doughnut" :data="roleChart" :options="roleOptions" class="h-full w-full" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div class="p-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
            <h2 class="font-bold text-gray-800 flex items-center gap-2"><i class="pi pi-bolt text-amber-500"></i> Topik Terpopuler</h2>
          </div>
          <div class="p-1 grow">
            <DataTable :value="popularTopics" :rows="5" size="small" stripedRows class="text-sm">
              <Column header="Judul Diskusi">
                <template #body="slotProps">
                  <span class="font-medium text-gray-800 line-clamp-1" :title="stripHtml(slotProps.data.title)">
                    {{ stripHtml(slotProps.data.title) }}
                  </span>
                </template>
              </Column>
              <Column header="Tipe" style="width: 80px">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.type" :severity="slotProps.data.type === 'FORUM' ? 'info' : 'success'" class="text-[9px]" />
                </template>
              </Column>
              <Column header="Balasan" style="width: 80px" class="text-center font-bold text-gray-600" field="replies" />
            </DataTable>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div class="p-5 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
            <h2 class="font-bold text-gray-800 flex items-center gap-2"><i class="pi pi-star-fill text-yellow-500"></i> Kontributor Teraktif</h2>

            <RouterLink :to="`/communities/${community.slug}/leaderboard`" class="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
              Lihat Selengkapnya <i class="fa-solid fa-arrow-right"></i>
            </RouterLink>
          </div>
          <div class="p-1 grow">
            <DataTable :value="contributors" :rows="5" size="small" stripedRows class="text-sm">
              <Column header="#" class="text-center font-bold text-gray-400 w-10">
                <template #body="slotProps">
                  <span v-if="slotProps.index === 0">🥇</span>
                  <span v-else-if="slotProps.index === 1">🥈</span>
                  <span v-else-if="slotProps.index === 2">🥉</span>
                  <span v-else>{{ slotProps.index + 1 }}</span>
                </template>
              </Column>

              <Column header="Anggota" field="fullname" class="min-w-[150px]">
                <template #body="slotProps">
                  <div class="flex flex-col">
                    <span class="font-bold text-xs">{{ slotProps.data.fullname }}</span>
                    <span class="text-[9px] text-gray-500">{{ slotProps.data.role }}</span>
                  </div>
                </template>
              </Column>

              <Column header="P" field="posts" class="text-center text-gray-500 w-[50px]" headerTooltip="Postingan" />

              <Column header="F" field="forums" class="text-center text-gray-500 w-[50px]" headerTooltip="Forum Diskusi" />

              <Column header="K" field="comments" class="text-center text-gray-500 w-[50px]" headerTooltip="Komentar" />

              <Column header="R" field="responds" class="text-center text-gray-500 w-[50px]" headerTooltip="Respon Forum" />

              <Column header="Total" class="text-center w-[70px]">
                <template #body="slotProps">
                  <span class="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs">
                    {{ slotProps.data.total }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-dropdown-label) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
