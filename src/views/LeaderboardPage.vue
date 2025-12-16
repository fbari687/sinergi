<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import adminApi from "@/services/adminApi";

// PrimeVue
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import Tag from "primevue/tag";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";

const router = useRouter();
const loading = ref(false);
const leaderboardData = ref([]);

// Filter Period
const selectedPeriod = ref("this_month");
const periodOptions = [
  { label: "Bulan Ini", value: "this_month" },
  { label: "7 Hari Terakhir", value: "7_days" },
  { label: "30 Hari Terakhir", value: "30_days" },
  { label: "Sepanjang Waktu", value: "all_time" }, // Pastikan backend handle 'all_time'
];

const loadLeaderboard = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getGlobalLeaderboard(selectedPeriod.value);
    leaderboardData.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

watch(selectedPeriod, () => {
  loadLeaderboard();
});

onMounted(() => {
  loadLeaderboard();
});

// Helper Ranking
const getRankIcon = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
};

// Helper Role Color
const getRoleSeverity = (role) => {
  switch (role) {
    case "Admin":
      return "contrast";
    case "Dosen":
      return "success";
    case "Mahasiswa":
      return "info";
    case "Mitra":
      return "warning";
    default:
      return "secondary";
  }
};
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 pb-12">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Global Leaderboard</h1>
          <p class="text-gray-500 text-sm">Peringkat kontributor teraktif dari seluruh komunitas.</p>
        </div>

        <div class="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <div class="px-2 text-gray-400"><i class="pi pi-calendar"></i></div>
          <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="w-40 text-sm border-none shadow-none" />
          <Button icon="pi pi-refresh" rounded text @click="loadLeaderboard" :loading="loading" />
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable :value="leaderboardData" :loading="loading" responsiveLayout="scroll" class="text-sm" stripedRows paginator :rows="20">
          <template #empty>
            <div class="text-center py-10 text-gray-500">Belum ada aktivitas pada periode ini.</div>
          </template>

          <Column header="Rank" class="w-16 text-center font-bold text-lg">
            <template #body="slotProps">
              <span v-if="slotProps.index < 3" class="text-2xl">{{ getRankIcon(slotProps.index) }}</span>
              <span v-else class="text-gray-500">{{ slotProps.index + 1 }}</span>
            </template>
          </Column>

          <Column header="User">
            <template #body="slotProps">
              <div class="flex items-center gap-3 py-2">
                <img :src="slotProps.data.profile_picture || `https://ui-avatars.com/api/?name=${slotProps.data.fullname}`" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div class="flex flex-col">
                  <span class="font-bold text-gray-900">{{ slotProps.data.fullname }}</span>
                  <div class="mt-1">
                    <Tag :value="slotProps.data.role_name" :severity="getRoleSeverity(slotProps.data.role_name)" class="text-[10px] px-2 py-0.5" />
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Post" field="posts" class="text-center w-20 text-gray-600" sortable />
          <Column header="Forum" field="forums" class="text-center w-20 text-gray-600" sortable />
          <Column header="Komentar" field="comments" class="text-center w-20 text-gray-600" sortable />
          <Column header="Respon" field="responds" class="text-center w-20 text-gray-600" sortable />

          <Column header="Total Poin" field="total_interactions" class="text-center w-32" sortable>
            <template #body="slotProps">
              <span class="inline-block bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg text-sm">
                {{ slotProps.data.total_interactions }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </LayoutDefaultUser>
</template>

<style scoped>
:deep(.p-dropdown-label) {
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
}
</style>
