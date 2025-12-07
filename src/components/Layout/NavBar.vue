<script setup>
import { Menubar, useConfirm } from "primevue";
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();
const router = useRouter();
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

const items = ref([
  {
    label: authStore.user.fullname,
    items: [
      {
        label: "My Profile",
        icon: "fas fa-user-circle",
        command: () => {
          router.push(`/profile/${authStore.user.username}`);
        },
      },
      // {
      //   label: "Settings",
      //   icon: "fas fa-cog",
      // },
      {
        separator: true,
      },
      {
        label: "Logout",
        icon: "fas fa-sign-out-alt",
        command: () => {
          handleLogoutConfirm();
        },
      },
    ],
  },
]);
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
        <img :src="authStore.user.profile_picture" class="block w-10 h-10 rounded-full cursor-pointer object-cover border-2 border-gray-200 mr-2" alt="Foto User" />
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
/* :deep() memaksa style ini masuk ke dalam 
  komponen Menubar
*/

/* Secara default (mobile), SEMBUNYIKAN 
  seluruh daftar menu <ul>.
*/
:deep(.p-menubar-root-list) {
  display: none;
}

/* Pada breakpoint 'md' (768px) dan lebih besar,
  TAMPILKAN kembali daftar menu <ul> sebagai flex.
*/
@media (min-width: 1024px) {
  :deep(.p-menubar-root-list) {
    display: flex;
  }
}
</style>
