<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import CommunityHeader from "@/components/Communities/CommunityHeader.vue";
import CommunityHeaderSkeleton from "@/components/Communities/CommunityHeaderSkeleton.vue";
import communityApi from "@/services/communityApi";

const route = useRoute();
const router = useRouter();

const community = ref(null);
const loading = ref(true);

// Ambil slug dari URL
const communitySlug = computed(() => route.params.slug);

const loadCommunity = async () => {
  // Guard: Jika tidak ada slug, jangan fetch
  if (!communitySlug.value) return;

  loading.value = true;
  try {
    // PERBAIKAN 1: Gunakan nama method yang sesuai di communityApi.js (getCommunity)
    const response = await communityApi.getCommunityDetail(communitySlug.value);
    community.value = response.data.data;

    // PERBAIKAN 2: Hanya set loading false jika data BERHASIL didapat
    loading.value = false;
  } catch (err) {
    console.error("Gagal memuat community", err);

    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        router.replace({ name: "ForbiddenPage" });
      } else if (status === 404) {
        router.replace({ name: "Communities" });
      }
    }
    // PENTING: Biarkan loading tetap true agar template tidak error saat akses properti 'community' yang null
  }
};

// Initial Load
onMounted(() => {
  loadCommunity();
});

// PERBAIKAN 3: Watcher WAJIB ADA untuk menangani redirect/perubahan slug
// Tanpa ini, saat router.replace dijalankan, halaman tidak akan memuat data baru
watch(communitySlug, (newVal) => {
  if (newVal) {
    loadCommunity();
  }
});

// Handler refresh manual
const handleRefresh = () => {
  loadCommunity();
};
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <main class="grow flex flex-col items-center justify-center w-full pt-4 md:pt-0 md:mt-20">
      <!-- 1. LOADING STATE -->
      <template v-if="loading">
        <CommunityHeaderSkeleton />
      </template>

      <!-- 2. CONTENT STATE -->
      <template v-else>
        <!-- Aman dirender karena loading false berarti community ada -->
        <CommunityHeader :community="community" @refresh="handleRefresh" />
      </template>

      <div class="w-full max-w-[1250px] flex items-start justify-center lg:justify-between gap-2 px-2 md:px-8">
        <!-- Render RouterView hanya jika tidak loading & community ada -->
        <RouterView v-if="!loading && community" :community="community" @refresh="handleRefresh" />
      </div>
    </main>
  </LayoutDefaultUser>
</template>

<style scoped></style>
