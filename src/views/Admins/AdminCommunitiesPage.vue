<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import CommunityCard from "@/components/Communities/CommunityCard.vue";
import CommunityCardSkeleton from "@/components/Communities/CommunityCardSkeleton.vue";
import communityApi from "@/services/communityApi";
import { onMounted, ref, watch } from "vue";
import { useConfirm, useToast } from "primevue";
import Paginator from "primevue/paginator"; // IMPORT PAGINATOR
import Dropdown from "primevue/dropdown"; // IMPORT DROPDOWN
import _ from "lodash";

const confirm = useConfirm();
const toast = useToast();

// STATE
const communities = ref([]);
const loading = ref(true);

// PAGINATION, SEARCH, SORT
const page = ref(1);
const perPage = ref(9); // 9 card grid (3x3)
const totalRecords = ref(0);
const searchQuery = ref("");
const sortOption = ref("newest");

const sortOptions = [
  { label: "Terbaru", value: "newest" },
  { label: "Terlama", value: "oldest" },
  { label: "Anggota Terbanyak", value: "most_members" },
  { label: "Anggota Paling Sedikit", value: "least_members" },
];

// --- LOAD DATA ---
const loadCommunities = async () => {
  loading.value = true;
  try {
    // Panggil API baru khusus admin
    const response = await communityApi.getAllCommunities(page.value, perPage.value, searchQuery.value, sortOption.value);

    // API Mengembalikan { data: { data: [], meta: {} } }
    const responseData = response.data.data;

    communities.value = responseData.data;
    totalRecords.value = responseData.meta.total_items;
  } catch (error) {
    console.error("Gagal memuat komunitas:", error);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat data komunitas." });
  } finally {
    loading.value = false;
  }
};

// --- HANDLERS ---
const handleSearch = _.debounce(() => {
  page.value = 1; // Reset ke halaman 1 saat search
  loadCommunities();
}, 500);

const onPageChange = (event) => {
  page.value = event.page + 1; // PrimeVue index 0, Backend index 1
  loadCommunities();
  // Scroll ke atas sedikit
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Watch Sort agar otomatis reload
watch(sortOption, () => {
  page.value = 1;
  loadCommunities();
});

// --- ADMIN ACTION (DELETE) ---
const confirmDeleteCommunity = (community) => {
  confirm.require({
    message: `Apakah Anda yakin ingin menghapus komunitas "${community.name}" beserta seluruh isinya?`,
    header: "Hapus Komunitas",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Batal",
    rejectProps: {
      label: "Batal",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Hapus",
      severity: "danger",
    },
    accept: async () => {
      try {
        await communityApi.deleteCommunity(community.slug);

        // Refresh data agar pagination/total update
        loadCommunities();

        toast.add({ severity: "success", summary: "Sukses", detail: "Komunitas berhasil dihapus." });
      } catch (err) {
        console.error("Gagal hapus komunitas:", err);
        toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus komunitas." });
      }
    },
  });
};

onMounted(() => {
  loadCommunities();
});
</script>

<template>
  <LayoutAdminUser>
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 flex flex-col items-center">
      <div class="w-full max-w-7xl mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Kelola Komunitas</h1>
          <p class="text-sm text-gray-500 mt-1">Daftar seluruh komunitas yang terdaftar di sistem.</p>
        </div>

        <div class="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold border border-blue-100">Total: {{ totalRecords }}</div>
      </div>

      <div class="w-full max-w-7xl mb-8 flex flex-col md:flex-row gap-4">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
            <i class="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Cari nama komunitas..."
            class="w-full p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
          />
          <button
            v-if="searchQuery"
            @click="
              searchQuery = '';
              handleSearch();
            "
            class="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="w-full md:w-56">
          <Dropdown v-model="sortOption" :options="sortOptions" optionLabel="label" optionValue="value" placeholder="Urutkan" class="w-full rounded-xl! border-gray-300!" />
        </div>
      </div>

      <div class="w-full max-w-7xl pb-20">
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <CommunityCardSkeleton v-for="n in 6" :key="n" />
        </div>

        <template v-else>
          <div v-if="communities.length === 0" class="w-full bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 flex flex-col items-center">
            <i class="fa-solid fa-users-slash text-4xl mb-3 text-gray-300"></i>
            <p v-if="searchQuery">
              Tidak ditemukan komunitas dengan nama "<b>{{ searchQuery }}</b
              >".
            </p>
            <p v-else>Belum ada komunitas yang dibuat.</p>
          </div>

          <div v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              <div v-for="community in communities" :key="community.id" class="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div class="grow">
                  <CommunityCard :community="community" :isJoined="false" :isAdminView="true" />
                </div>

                <div class="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                  <div class="flex flex-col">
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Anggota</span>
                    <span class="text-sm font-bold text-gray-800">{{ community.total_members || 0 }}</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Akses</span>
                    <span class="text-xs font-bold" :class="community.is_public ? 'text-green-600' : 'text-orange-600'">
                      {{ community.is_public ? "Publik" : "Privat" }}
                    </span>
                  </div>

                  <button
                    @click="confirmDeleteCommunity(community)"
                    class="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                  >
                    <i class="fa-regular fa-trash-can"></i>
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <Paginator :rows="perPage" :totalRecords="totalRecords" :first="(page - 1) * perPage" @page="onPageChange" template="PrevPageLink PageLinks NextPageLink" class="bg-transparent! border-none!" />
          </div>
        </template>
      </div>
    </div>
  </LayoutAdminUser>
</template>

<style scoped>
:deep(.p-dropdown) {
  height: 46px; /* Samakan tinggi dengan input search */
  align-items: center;
}
:deep(.p-paginator) {
  justify-content: center;
}
:deep(.p-paginator-page.p-highlight) {
  background-color: #eff6ff;
  color: #1d4ed8;
  border-color: #dbeafe;
}
</style>
