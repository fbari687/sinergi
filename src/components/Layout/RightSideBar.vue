<script setup>
import { ref, onMounted } from "vue";
import communityApi from "@/services/communityApi";
import CommunityTile from "@/components/Communities/CommunityTile.vue";
import CommunityTileSkeleton from "../Communities/CommunityTileSkeleton.vue";

const communities = ref([]);
const loading = ref(true);

const loadCommunities = async () => {
  loading.value = true;
  try {
    const response = await communityApi.getCommunityJoinedByMe({ limit: 5 });
    communities.value = response.data.data;
  } catch (error) {
    console.error("Gagal memuat komunitas:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadCommunities);
</script>

<template>
  <aside class="hidden xl:block fixed top-[74px] right-0 w-[360px] h-[calc(100vh-74px)] z-30 bg-gray-100 text-black overflow-y-auto p-4">
    <!-- Widget Komunitas (Versi Tailwind) -->
    <div class="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h4 class="text-lg font-bold mt-0 mb-5">Komunitas yang anda ikuti</h4>
      <template v-if="loading">
        <CommunityTileSkeleton v-for="n in 3" :key="n" />
      </template>
      <template v-else>
        <template v-if="communities.length === 0">
          <p>Belum mengikuti komunitas.</p>
        </template>
        <template v-else>
          <CommunityTile v-for="community in communities" :key="community.slug" :community="community" />
        </template>
      </template>
    </div>

    <!-- <div class="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h4 class="text-lg font-bold mt-0 mb-5">Disarankan untuk Anda</h4>
      <ul class="list-none p-0 m-0 flex flex-col gap-4">
        <li class="flex items-center">
          <img src="https://placehold.co/40x40/E8D4C6/333?text=KMJ" alt="User" class="w-10 h-10 rounded-full mr-3 object-cover" />
          <div class="grow"><h5 class="text-sm font-medium m-0">Kim Min-jeong</h5></div>
          <a href="#" class="no-underline bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 hover:bg-blue-700">Follow</a>
        </li>
        <li class="flex items-center">
          <img src="https://placehold.co/40x40/C6E8D4/333?text=NY" alt="User" class="w-10 h-10 rounded-full mr-3 object-cover" />
          <div class="grow"><h5 class="text-sm font-medium m-0">Ning Yizhuo</h5></div>
          <a href="#" class="no-underline bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 hover:bg-blue-700">Follow</a>
        </li>
        <li class="flex items-center">
          <img src="https://placehold.co/40x40/D4C6E8/333?text=AU" alt="User" class="w-10 h-10 rounded-full mr-3 object-cover" />
          <div class="grow"><h5 class="text-sm font-medium m-0">Aeri Uchinaga</h5></div>
          <a href="#" class="no-underline bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 hover:bg-blue-700">Follow</a>
        </li>
      </ul>
    </div> -->
  </aside>
</template>

<style scoped></style>
