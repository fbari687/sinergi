<script setup>
import LeftSideBar from "@/components/Layout/LeftSideBar.vue";
import RightSideBar from "@/components/Layout/RightSideBar.vue";
import NavBar from "@/components/Layout/NavBar.vue";
// Import ProfileCompletionDialog
import ProfileCompletionDialog from "@/components/Profiles/ProfileCompletionDialog.vue";
// Import computed dari vue dan store
import { computed } from "vue";
import { useAuthStore } from "@/store/auth";

// Props layout
const props = defineProps({
  useNavbar: {
    type: Boolean,
    default: true,
  },
  useSidebar: {
    type: Boolean,
    default: true,
  },
  useRightSidebar: {
    type: Boolean,
    default: true,
  },
});

// Setup Store & Computed
const authStore = useAuthStore();
const showProfileDialog = computed(() => {
  // Tampilkan dialog JIKA:
  // 1. User terautentikasi (ada data user)
  // 2. Property is_profile_complete === false
  return authStore.user && authStore.user.is_profile_complete === false;
});

// Callback saat dialog selesai mengisi
const onProfileCompleted = () => {
  // Tidak perlu logic khusus, karena component dialog sudah mengupdate state pinia
  // yang akan otomatis membuat showProfileDialog menjadi false
};
</script>

<template>
  <main class="bg-gray-100 min-h-full max-w-dvw">
    <template v-if="useNavbar">
      <NavBar />
    </template>
    <template v-if="useSidebar">
      <LeftSideBar />
    </template>

    <div class="w-full pt-16 pb-16 md:pt-3 md:pb-6 flex items-start justify-center bg-gray-100">
      <template v-if="useSidebar">
        <div class="lg:w-[320px] lg:min-w-[320px]"></div>
      </template>

      <slot />

      <template v-if="useRightSidebar">
        <div class="xl:w-[360px] xl:min-w-[360px]"></div>
      </template>
    </div>

    <template v-if="useRightSidebar">
      <RightSideBar />
    </template>

    <!-- PASANG DIALOG SECARA GLOBAL DI LAYOUT -->
    <ProfileCompletionDialog :visible="showProfileDialog" @completed="onProfileCompleted" />
  </main>
</template>

<style scoped></style>
