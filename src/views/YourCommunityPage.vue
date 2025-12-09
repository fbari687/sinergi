<script setup>
import CommunityCard from "@/components/Communities/CommunityCard.vue";
import CommunityCardSkeleton from "@/components/Communities/CommunityCardSkeleton.vue";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import communityApi from "@/services/communityApi";
import { ref, onMounted, watch, computed } from "vue";
import { useCommunityStore } from "@/store/community";
import CreateCommunity from "@/components/Communities/CreateCommunity.vue";
import { useAuthStore } from "@/store/auth";

const communities = ref([]); // Data mentah dari API
const loading = ref(true);
const searchQuery = ref("");
const communityStore = useCommunityStore();
const authStore = useAuthStore();

const loadCommunities = async () => {
  loading.value = true;
  try {
    const response = await communityApi.getCommunityJoinedByMe();
    // Backend sekarang mengirimkan field 'current_user_role'
    communities.value = response.data.data;
  } catch (error) {
    console.error("Gagal memuat komunitas:", error);
  } finally {
    loading.value = false;
  }
};

// --- LOGIKA FILTER ---

// 1. Filter Search Global
const filteredCommunities = computed(() => {
  if (!searchQuery.value) return communities.value;
  return communities.value.filter((c) => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// 2. Filter Milik Sendiri (Role OWNER)
const myOwnCommunities = computed(() => {
  return filteredCommunities.value.filter((c) => c.current_user_role === "OWNER");
});

// 3. Filter yang Diikuti (Role ADMIN / MEMBER)
const joinedCommunities = computed(() => {
  return filteredCommunities.value.filter((c) => c.current_user_role !== "OWNER");
});

const isInternal = computed(() => {
  return authStore.user.role === "Admin" || authStore.user.role === "Mahasiswa" || authStore.user.role === "Dosen";
});

onMounted(loadCommunities);

watch(
  () => communityStore.refreshTrigger,
  () => {
    loadCommunities();
  }
);
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <main class="grow flex items-center justify-center pt-4 md:pt-0 md:mt-20 mb-20">
      <div class="w-full max-w-7xl flex flex-col gap-8 items-center justify-center px-4 lg:px-0">
        <div class="w-full flex flex-col gap-4">
          <div class="w-full flex items-end justify-between text-sm md:text-base font-medium border-b border-gray-200 pb-4">
            <div class="w-full">
              <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Komunitas Saya</h1>
              <p class="text-sm text-gray-500">Kelola komunitas yang Anda <span v-if="isInternal">buat dan</span> ikuti.</p>
              <div class="w-full block lg:hidden mt-2">
                <CreateCommunity v-if="isInternal" />
              </div>
            </div>
          </div>

          <div class="w-full relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari komunitas..."
              class="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
            />
            <button class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
              <i class="fas fa-search text-lg"></i>
            </button>
          </div>
        </div>

        <div v-if="loading" class="w-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
          <CommunityCardSkeleton v-for="n in 3" :key="n" />
        </div>

        <template v-else>
          <div v-if="isInternal" class="w-full flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-crown text-yellow-500"></i>
              <h2 class="text-lg font-bold text-gray-800">Dikelola oleh Anda ({{ myOwnCommunities.length }})</h2>
            </div>

            <div v-if="myOwnCommunities.length > 0" class="w-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
              <CommunityCard v-for="community in myOwnCommunities" :community="community" :key="community.slug" :isJoined="true" />
            </div>

            <div v-else class="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
              <p v-if="searchQuery">Tidak ditemukan komunitas yang cocok.</p>
              <p v-else>Anda belum membuat komunitas apapun.</p>
            </div>
          </div>

          <hr v-if="isInternal" class="w-full border-gray-200" />

          <div class="w-full flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-users text-blue-500"></i>
              <h2 class="text-lg font-bold text-gray-800">Diikuti oleh Anda ({{ joinedCommunities.length }})</h2>
            </div>

            <div v-if="joinedCommunities.length > 0" class="w-full grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
              <CommunityCard v-for="community in joinedCommunities" :community="community" :key="community.slug" :isJoined="true" />
            </div>

            <div v-else class="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500 text-sm">
              <p v-if="searchQuery">Tidak ditemukan komunitas yang cocok.</p>
              <p v-else>Anda belum mengikuti komunitas apapun.</p>
            </div>
          </div>
        </template>
      </div>
    </main>
  </LayoutDefaultUser>
</template>
