<script setup>
import { Menubar, useConfirm } from "primevue";
import { computed } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const confirm = useConfirm();

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

const items = computed(() => {
  // 1. Siapkan array submenu default
  const subMenuItems = [];

  // 2. Cek Role: Jika BUKAN Admin, tambahkan menu "My Profile"
  // Pastikan properti 'role' sesuai dengan data user di authStore (misal: user.role atau user.role_name)
  if (authStore.user?.role !== "Admin") {
    subMenuItems.push({
      label: "My Profile",
      icon: "fas fa-user-circle",
      command: () => {
        if (authStore.user) {
          router.push(`/profile/${authStore.user.username}`);
        }
      },
    });
  }

  // 3. Tambahkan Separator dan Logout (Selalu ada untuk semua role)
  subMenuItems.push(
    {
      separator: true,
    },
    {
      label: "Logout",
      icon: "fas fa-sign-out-alt",
      command: () => {
        if (authStore.user) {
          handleLogoutConfirm();
        }
      },
    }
  );

  // 4. Return struktur menu utama
  return [
    {
      label: authStore.user?.fullname || "User",
      items: subMenuItems,
    },
  ];
});
</script>

<template>
  <Menubar :model="items" breakpoint="1px" class="fixed w-full z-40 py-2! px-6! justify-between">
    <template #start>
      <RouterLink to="/">
        <img src="/logo_sinergi.png" alt="Sinergi Logo" class="h-[50px]" />
      </RouterLink>
    </template>
    <template #item="{ item, props, hasSubmenu, root }">
      <a v-if="root" v-ripple class="flex items-center" v-bind="props.action">
        <img v-if="authStore.user" :src="authStore.user?.profile_picture" class="block w-10 h-10 rounded-full cursor-pointer object-cover border-2 border-gray-200 mr-2" alt="Foto User" />
        <span class="font-semibold">{{ item.label }}</span>
        <i v-if="hasSubmenu" class="pi pi-angle-down ml-2"></i>
      </a>

      <a v-else v-ripple class="flex items-center" v-bind="props.action">
        <span :class="item.icon" class="mr-2 w-5 text-center" />
        <span>{{ item.label }}</span>
      </a>
    </template>
  </Menubar>
</template>

<style scoped>
/* :deep() memaksa style ini masuk ke dalam komponen Menubar */

/* Secara default (mobile), SEMBUNYIKAN seluruh daftar menu <ul>. */
:deep(.p-menubar-root-list) {
  display: none;
}

/* Pada breakpoint 'lg' (1024px) dan lebih besar, TAMPILKAN kembali daftar menu <ul>. */
@media (min-width: 1024px) {
  :deep(.p-menubar-root-list) {
    display: flex;
  }
}
</style>
