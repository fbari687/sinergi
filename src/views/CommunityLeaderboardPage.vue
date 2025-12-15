<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import communityApi from "@/services/communityApi";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";

// PrimeVue
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import Tag from "primevue/tag";

const route = useRoute();
const slug = route.params.slug;

const loading = ref(false);
const leaderboardData = ref([]);
const communityName = ref("");

// Filter Period
const selectedPeriod = ref("this_month");
const periodOptions = [
  { label: "Bulan Ini", value: "this_month" },
  { label: "7 Hari Terakhir", value: "7_days" },
  { label: "30 Hari Terakhir", value: "30_days" },
  { label: "Sepanjang Waktu", value: "all_time" },
];

const loadLeaderboard = async () => {
  loading.value = true;
  try {
    const res = await communityApi.getLeaderboard(slug, selectedPeriod.value);
    leaderboardData.value = res.data.data.leaderboard;
    communityName.value = res.data.data.community_name;
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

// Helper untuk Ranking Styling
const getRankIcon = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return index + 1;
};

const getRowClass = (data, index) => {
  if (index === 0) return "bg-yellow-50";
  if (index === 1) return "bg-gray-50";
  if (index === 2) return "bg-orange-50";
  return "";
};
</script>

<template>
  <div class="w-full max-w-full p-6 space-y-4">
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900">Leaderboard Komunitas</h1>
      <p class="text-gray-500">
        Kontributor paling aktif di <span class="font-bold text-gray-700">{{ communityName }}</span>
      </p>
    </div>

    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-trophy text-yellow-500 text-xl"></i>
        <span class="font-bold text-gray-700">Periode:</span>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Dropdown v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" class="w-full sm:w-56" />
        <Button icon="pi pi-refresh" rounded text @click="loadLeaderboard" :loading="loading" />
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <DataTable :value="leaderboardData" :loading="loading" responsiveLayout="scroll" class="text-sm" stripedRows>
        <template #empty>
          <div class="text-center py-10 text-gray-500">Belum ada aktivitas pada periode ini.</div>
        </template>

        <Column header="Rank" class="w-16 text-center font-bold text-lg">
          <template #body="slotProps">
            <span v-if="slotProps.index < 3" class="text-2xl">{{ getRankIcon(slotProps.index) }}</span>
            <span v-else class="text-gray-500">{{ slotProps.index + 1 }}</span>
          </template>
        </Column>

        <Column header="Kontributor">
          <template #body="slotProps">
            <div class="flex items-center gap-3 py-2">
              <img :src="slotProps.data.profile_picture || `https://ui-avatars.com/api/?name=${slotProps.data.fullname}`" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
              <div class="flex flex-col">
                <span class="font-bold text-gray-900">{{ slotProps.data.fullname }}</span>
                <span class="text-xs text-gray-500">{{ slotProps.data.role }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column header="Post" field="posts" class="text-center w-20 text-gray-600" />
        <Column header="Forum" field="forums" class="text-center w-20 text-gray-600" />
        <Column header="Komentar" field="comments" class="text-center w-20 text-gray-600" />
        <Column header="Respon" field="responds" class="text-center w-20 text-gray-600" />

        <Column header="Total Poin" field="total" class="text-center w-32" sortable>
          <template #body="slotProps">
            <Tag :value="slotProps.data.total" severity="info" class="text-sm px-3 py-1 font-bold bg-blue-100 text-blue-700" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
