<script setup>
import { useAuthStore } from "@/store/auth";
import { useRoute } from "vue-router";
import MenuLinkTile from "../Sidebar/MenuLinkTile.vue";
import CommunitiesSidebar from "../Communities/CommunitiesSidebar.vue";
import { computed } from "vue";
const authStore = useAuthStore();
const route = useRoute();

const showCommunityMenu = computed(() => {
  return (
    route.path.startsWith("/communities") &&
    route.name !== "CommunityPosts" &&
    route.name !== "CommunityForums" &&
    route.name !== "CommunityMembers" &&
    route.name !== "ForumDetail" &&
    route.name !== "CommunityDashboard" &&
    route.name !== "CommunityLeaderboard"
  );
});

const isInternal = computed(() => {
  return authStore.user.role === "Admin" || authStore.user.role === "Mahasiswa" || authStore.user.role === "Dosen";
});

const isDosen = computed(() => {
  return authStore.user.role === "Dosen";
});

const unreadNotificationCount = computed(() => authStore.user?.unread_notifications_count || 0);
</script>

<template>
  <aside class="hidden fixed top-[74px] left-0 w-[320px] max-w-[320px] max h-[calc(100vh-74px)] bg-gray-100 p-4 z-30 overflow-y-auto lg:flex flex-col justify-start gap-2">
    <div class="flex flex-col gap-2">
      <div v-if="authStore.user" class="bg-white flex flex-col gap-2 rounded-lg border border-gray-200 overflow-hidden">
        <div class="w-full bg-[linear-gradient(to_bottom,#4f74e8_50%,#fff_50%)] h-[100px] flex flex-col items-start justify-center px-4">
          <RouterLink :to="'/profile/' + authStore.user.username">
            <div class="p-1 rounded-full bg-white">
              <img :src="authStore.user.profile_picture" class="rounded-full w-[72px] h-[72px] object-cover" alt="" />
            </div>
          </RouterLink>
        </div>
        <div class="px-4 pb-4 flex flex-col gap-2">
          <RouterLink :to="'/profile/' + authStore.user.username">
            <h3 class="font-bold text-xl">{{ authStore.user.fullname }} ({{ authStore.user.username }})</h3>
          </RouterLink>
          <RouterLink :to="'/profile/' + authStore.user.username">
            <p>{{ authStore.user.bio }}</p>
          </RouterLink>
          <RouterLink :to="'/profile/' + authStore.user.username">
            <p class="text-sm">{{ authStore.user.role }}</p>
          </RouterLink>
        </div>
      </div>
      <div v-else>
        <p>Memuat data pengguna...</p>
      </div>
      <div class="px-4 py-2 bg-white rounded-lg border border-gray-200">
        <nav>
          <ul class="list-none p-0 m-0">
            <li>
              <MenuLinkTile v-if="isInternal" to="/home" icon="fa-solid fa-home" label="Beranda" />
              <MenuLinkTile to="/notifications" icon="fa-solid fa-bell" label="Notifikasi" is-notification="true" :count-notification="unreadNotificationCount" />
              <MenuLinkTile v-if="isDosen" to="/leaderboard" icon="fa-solid fa-medal" label="Papan Skor" />
              <MenuLinkTile :to="isInternal ? '/communities' : '/communities/joined'" icon="fa-solid fa-users" label="Komunitas" />
            </li>
          </ul>
        </nav>
      </div>
    </div>
    <CommunitiesSidebar v-if="showCommunityMenu && isInternal" />
  </aside>
  <nav class="fixed w-full h-14 z-10 bottom-0 py-2 px-4 lg:hidden flex items-center justify-between bg-white">
    <MenuLinkTile v-if="isInternal" to="/home" icon="fa-solid fa-home text-sm" />
    <MenuLinkTile v-if="isDosen" to="/leaderboard" icon="fa-solid fa-medal" />
    <MenuLinkTile to="/notifications" icon="fa-solid fa-bell" />
    <MenuLinkTile :to="isInternal ? '/communities' : '/communities/joined'" icon="fa-solid fa-users" />
    <MenuLinkTile :to="`/profile/${authStore.user.username}`" :image="authStore.user.profile_picture" />
  </nav>
</template>

<style scoped></style>
