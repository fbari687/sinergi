<script setup>
import SideBar from "@/components/Admins/Partials/SideBar.vue";
import NavBar from "@/components/Layout/NavBar.vue";
// Import ProfileCompletionDialog
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
});

// Setup Store & Computed
const authStore = useAuthStore();
</script>

<template>
  <main class="bg-gray-100 min-h-full max-w-dvw">
    <template v-if="useNavbar">
      <NavBar />
    </template>
    <template v-if="useSidebar">
      <SideBar />
    </template>

    <div class="w-full pt-16 pb-16 md:pt-3 md:pb-6 flex items-start justify-center bg-gray-100">
      <template v-if="useSidebar">
        <div class="lg:min-w-[320px]"></div>
      </template>

      <slot />
    </div>
  </main>
</template>

<style scoped></style>
