<script setup>
import CommunityCardSkeleton from "@/components/Communities/CommunityCardSkeleton.vue";
import CommunityCard from "@/components/Communities/CommunityCard.vue";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import communityApi from "@/services/communityApi";
import { onMounted, ref, watch } from "vue";
import { useCommunityStore } from "@/store/community";
import _ from "lodash"; // Pastikan lodash sudah diinstall: npm install lodash

const communitiesJoined = ref([]);
const recommendedCommunities = ref([]);
const loadingJoined = ref(true);
const loadingRecommended = ref(true);
const communityStore = useCommunityStore();

// --- STATE PENCARIAN ---
const searchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
const loadingSearch = ref(false);

// --- LOGIKA LOAD DATA DEFAULT ---
const loadMyCommunities = async () => {
  loadingJoined.value = true;
  try {
    const response = await communityApi.getCommunityJoinedByMe({ limit: 3 });
    communitiesJoined.value = response.data.data;
  } catch (error) {
    console.error("Gagal memuat komunitas:", error);
  } finally {
    loadingJoined.value = false;
  }
};

const loadRecommendedCommunities = async () => {
  loadingRecommended.value = true;
  try {
    const response = await communityApi.getRecommendedCommunities();
    recommendedCommunities.value = response.data.data;
  } catch (error) {
    console.error("Gagal memuat komunitas:", error);
  } finally {
    loadingRecommended.value = false;
  }
};

// --- LOGIKA SEARCH (DEBOUNCE) ---
const handleSearch = _.debounce(async () => {
  // Jika input kosong atau hanya spasi -> Matikan mode search
  if (!searchQuery.value.trim()) {
    isSearching.value = false;
    searchResults.value = [];
    return;
  }

  // Aktifkan mode search
  isSearching.value = true;
  loadingSearch.value = true;

  try {
    const res = await communityApi.searchCommunities(searchQuery.value);
    searchResults.value = res.data.data;
  } catch (err) {
    console.error("Gagal mencari:", err);
  } finally {
    loadingSearch.value = false;
  }
}, 500); // Delay 500ms

// Fungsi untuk mereset pencarian manual
const clearSearch = () => {
  searchQuery.value = "";
  isSearching.value = false;
  searchResults.value = [];
};

onMounted(() => {
  loadMyCommunities();
  loadRecommendedCommunities();
});

watch(
  () => communityStore.refreshTrigger,
  () => {
    // Refresh data background
    loadMyCommunities();
    loadRecommendedCommunities();

    // Jika sedang search, refresh juga hasil searchnya (untuk update status join)
    if (isSearching.value) {
      handleSearch();
    }
  }
);
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <div class="grow flex flex-col items-center justify-center w-full lg:px-4 min-[1920px]:px-0 pt-4 md:pt-0 md:mt-20">
      <div class="w-full max-w-7xl flex flex-col items-center justify-center px-4 xl:px-0">
        <div class="mb-6 sm:mb-8 w-full">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Komunitas</h1>
          <p class="text-sm sm:text-base text-gray-600">Temukan dan bergabung dengan komunitas yang sesuai minatmu</p>
        </div>

        <div class="mb-6 sm:mb-8 w-full">
          <div class="relative">
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="Cari komunitas (contoh: Programming, Desain)..."
              class="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
            />
            <button class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
              <i v-if="loadingSearch" class="fas fa-circle-notch fa-spin text-lg text-blue-500"></i>
              <i v-else class="fas fa-search text-lg"></i>
            </button>
          </div>
        </div>

        <section v-if="isSearching" class="w-full mb-12 min-h-[50vh]">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-lg sm:text-xl font-bold text-gray-900">Hasil Pencarian "{{ searchQuery }}"</h2>
            <button @click="clearSearch" class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Hapus Pencarian</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <template v-if="loadingSearch">
              <CommunityCardSkeleton v-for="n in 3" :key="n" />
            </template>
            <template v-else>
              <template v-if="searchResults.length > 0">
                <CommunityCard v-for="community in searchResults" :community="community" :key="community.slug" :isJoined="community.is_joined" />
              </template>
              <template v-else>
                <div class="col-span-full bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 flex flex-col items-center">
                  <i class="fa-solid fa-magnifying-glass text-4xl mb-3 text-gray-300"></i>
                  <p class="font-medium">Tidak ditemukan komunitas dengan nama tersebut.</p>
                  <p class="text-sm mt-1">Coba kata kunci lain.</p>
                </div>
              </template>
            </template>
          </div>
        </section>

        <template v-else>
          <section class="mb-8 sm:mb-12 w-full">
            <div class="flex items-center justify-between mb-4 sm:mb-6">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900">Komunitasku</h2>
              <RouterLink to="/communities/joined" class="text-sm sm:text-base text-blue-500 hover:text-blue-600 font-medium transition-colors">Lihat Semua</RouterLink>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <template v-if="loadingJoined">
                <CommunityCardSkeleton v-for="n in 3" :key="n" />
              </template>
              <template v-else>
                <template v-if="communitiesJoined.length > 0">
                  <CommunityCard v-for="community in communitiesJoined" :community="community" :key="community.slug" :isJoined="true" />
                </template>
                <template v-else>
                  <div class="col-span-full bg-white border border-gray-200 rounded-xl p-6 mt-5 text-center text-gray-500">
                    <p>Belum mengikuti komunitas apapun.</p>
                  </div>
                </template>
              </template>
            </div>
          </section>

          <section class="w-full">
            <div class="flex items-center justify-between mb-4 sm:mb-6">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900">Rekomendasi Untukmu</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <template v-if="loadingRecommended">
                <CommunityCardSkeleton v-for="n in 3" :key="n" />
              </template>
              <template v-else>
                <template v-if="recommendedCommunities.length > 0">
                  <CommunityCard v-for="community in recommendedCommunities" :community="community" :key="community.slug" :isJoined="false" />
                </template>
                <template v-else>
                  <div class="col-span-full bg-white border border-gray-200 rounded-xl p-6 mt-5 text-center text-gray-500">
                    <p>Belum ada komunitas untuk di rekomendasikan.</p>
                  </div>
                </template>
              </template>
            </div>
          </section>
        </template>
        <div class="h-8"></div>
      </div>
    </div>
  </LayoutDefaultUser>
</template>

<style scoped></style>
