<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue"; // Layout Admin
import CommunityHeader from "@/components/Communities/CommunityHeader.vue"; // Reuse Header User
import CommunityHeaderSkeleton from "@/components/Communities/CommunityHeaderSkeleton.vue";
import communityApi from "@/services/communityApi";
import AdminCommunityHeader from "@/components/Admins/AdminCommunityHeader.vue";

const route = useRoute();
const router = useRouter();

const community = ref(null);
const loading = ref(true);

const communitySlug = computed(() => route.params.slug);

// Modifikasi Header untuk Admin: Matikan tombol Join/Leave di CommunityHeader
// Anda mungkin perlu update CommunityHeader untuk terima prop `isAdminView` agar menyembunyikan tombol aksi user biasa
const isAdminView = true;

const loadCommunity = async () => {
  if (!communitySlug.value) return;

  loading.value = true;
  try {
    // Gunakan endpoint detail biasa (backend biasanya return data lengkap jika admin)
    // Atau endpoint khusus admin jika ada data sensitif tambahan
    const response = await communityApi.getCommunityDetail(communitySlug.value);
    community.value = response.data.data;
    loading.value = false;
  } catch (err) {
    console.error("Gagal memuat community", err);
    if (err.response?.status === 404) {
      router.replace({ name: "AdminCommunities" }); // Redirect ke list admin
    }
  }
};

onMounted(() => {
  loadCommunity();
});

watch(communitySlug, (newVal) => {
  if (newVal) loadCommunity();
});

const handleRefresh = () => {
  loadCommunity();
};
</script>

<template>
  <LayoutAdminUser>
    <main class="grow flex flex-col items-center w-full pt-4 md:pt-0 md:mt-24 px-4">
      <template v-if="loading">
        <CommunityHeaderSkeleton />
      </template>

      <template v-else>
        <AdminCommunityHeader :community="community" />
      </template>

      <div class="w-full max-w-[1250px] flex items-start justify-center lg:justify-between gap-6">
        <RouterView v-if="!loading && community" :community="community" @refresh="handleRefresh" />
      </div>
    </main>
  </LayoutAdminUser>
</template>
