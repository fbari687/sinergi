<script setup>
import SideBar from "@/components/Admins/Partials/SideBar.vue";
import NavBar from "@/components/Layout/NavBar.vue";
// Import ProfileCompletionDialog
import { useAuthStore } from "@/store/auth";
import { useConfirm, Menu } from "primevue";
import { ref } from "vue";

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

const confirm = useConfirm();

const settingsMenu = ref(null);
const menuItems = ref([
  {
    label: "Keluar",
    icon: "pi pi-sign-out",
    class: "text-red-600 font-bold",
    command: () => {
      handleLogoutConfirm();
    },
  },
]);

// Helper Toggle Menu
const toggleSettingsMenu = (event) => {
  settingsMenu.value.toggle(event);
};

// Helper Logout
const handleLogoutConfirm = () => {
  confirm.require({
    message: "Apakah Anda yakin ingin keluar?",
    header: "Konfirmasi Keluar",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Ya, Keluar",
    rejectLabel: "Batal",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      await authStore.handleLogout();
    },
  });
};

// Setup Store & Computed
const authStore = useAuthStore();
</script>

<template>
  <main class="bg-gray-100 min-h-full max-w-dvw">
    <template v-if="useNavbar">
      <NavBar />
    </template>
    <div class="md:hidden sticky top-16 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
      <h1 class="font-bold text-lg text-gray-800 truncate">@{{ authStore.user?.username }}</h1>

      <div class="flex flex-col">
        <button @click="toggleSettingsMenu" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600">
          <i class="pi pi-cog text-xl"></i>
        </button>
        <Menu ref="settingsMenu" :model="menuItems" :popup="true" />
      </div>
    </div>
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
