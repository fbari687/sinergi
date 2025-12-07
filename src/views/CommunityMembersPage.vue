<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import memberApi from "@/services/memberApi";
import CommunityMembersTile from "@/components/Communities/CommunityMembersTile.vue";
import CommunityJoinRequests from "@/components/Communities/CommunityJoinRequests.vue";
import _ from "lodash";

const props = defineProps(["community"]);

// State
const admins = ref([]);
const members = ref([]);
const meta = ref({ total_admins: 0, total_members: 0 });
const searchQuery = ref("");
const loading = ref(false);
const page = ref(1);
const hasMore = ref(true);
const canViewMembers = ref(false);

// Infinite Scroll Logic
const loadTrigger = ref(null);
const observer = ref(null);

const currentUserRole = computed(() => props.community?.current_user_role || "MEMBER");

// Helper Roles
const isAdminOrOwner = computed(() => {
  const role = props.community?.current_user_role;
  return role === "OWNER" || role === "ADMIN";
});

const isPublic = computed(() => {
  return props.community?.is_public;
});

// --- LOGIKA UTAMA PERBAIKAN ---

const checkRoleInCommunity = () => {
  const isCommPublic = props.community.is_public;
  // User dianggap member jika statusnya GRANTED (bukan REQUEST/DECLINED)
  const isMember = props.community.user_membership_status === "GRANTED";

  // Logika: Boleh lihat jika (Komunitas Publik) ATAU (User adalah Member)
  if (isCommPublic || isMember) {
    canViewMembers.value = true;
    loadData(true); // <--- LOAD DATA HANYA DIPANGGIL DISINI
  } else {
    canViewMembers.value = false;
    loading.value = false; // Stop loading spinner
  }
};

const loadData = async (isReset = false) => {
  // Safety check tambahan: Jangan load jika tidak boleh lihat
  if (!canViewMembers.value) return;
  if (loading.value) return;

  if (isReset) {
    page.value = 1;
    hasMore.value = true;
    admins.value = [];
    members.value = [];
  }

  loading.value = true;
  try {
    const res = await memberApi.getMembers(props.community.slug, searchQuery.value, page.value);
    const data = res.data.data;

    if (page.value === 1) {
      admins.value = data.admins || [];
      members.value = data.members || [];
    } else {
      members.value.push(...data.members);
    }

    if (data.stats) {
      meta.value = data.stats;
      hasMore.value = data.stats.has_more;
    }
    if (hasMore.value) page.value++;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = _.debounce(() => {
  if (canViewMembers.value) loadData(true);
}, 500);

const onRefresh = () => {
  if (canViewMembers.value) loadData(true);
};

const onRequestHandled = () => {
  if (canViewMembers.value) loadData(true);
};

onMounted(() => {
  // 1. Cek Role Dulu, jangan langsung loadData!
  checkRoleInCommunity();

  // 2. Setup Observer
  observer.value = new IntersectionObserver(
    (entries) => {
      // Tambahkan syarat: && canViewMembers.value
      if (entries[0].isIntersecting && hasMore.value && !loading.value && canViewMembers.value) {
        loadData();
      }
    },
    { rootMargin: "200px" }
  );

  if (loadTrigger.value) observer.value.observe(loadTrigger.value);
});

onUnmounted(() => {
  if (observer.value) observer.value.disconnect();
});
</script>

<template>
  <template v-if="!canViewMembers">
    <div class="w-full flex justify-center">
      <div class="w-full max-w-[600px] bg-white border border-gray-200 rounded-xl p-8 mt-5 text-center text-gray-500 flex flex-col items-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fa-solid fa-lock text-3xl text-gray-400"></i>
        </div>
        <h4 class="font-bold text-lg text-gray-900 mb-1">Komunitas Ini Privat</h4>
        <p class="text-sm">Anda harus menjadi anggota untuk melihat daftar orang di komunitas ini.</p>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="w-full flex flex-col lg:flex-row gap-4 items-start pt-4 lg:pt-2">
      <div class="w-full grow flex flex-col gap-4">
        <div class="w-full bg-white border border-gray-200 rounded-xl p-5">
          <h2 class="font-bold text-lg text-gray-900">Anggota · {{ (meta.total_members + meta.total_admins).toLocaleString("id-ID") }}</h2>
          <div class="relative w-full mt-4">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Cari anggota" class="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
          </div>
        </div>

        <div v-if="admins.length > 0" class="w-full bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-bold text-gray-900 mb-2">Admin & Moderator · {{ meta.total_admins }}</h3>
          <CommunityMembersTile v-for="admin in admins" :key="admin.id" :member="admin" :currentUserRole="currentUserRole" :communitySlug="community.slug" @refresh="onRefresh" />
        </div>

        <div class="w-full bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="font-bold text-gray-900 mb-2">Anggota · {{ meta.total_members.toLocaleString("id-ID") }}</h3>

          <div v-if="members.length === 0 && !loading" class="text-center py-8 text-gray-400">Tidak ada anggota ditemukan.</div>

          <CommunityMembersTile v-for="member in members" :key="member.id" :member="member" :currentUserRole="currentUserRole" :communitySlug="community.slug" @refresh="onRefresh" />

          <div ref="loadTrigger" class="w-full py-4 flex justify-center">
            <i v-if="loading" class="fa-solid fa-circle-notch fa-spin text-blue-600"></i>
          </div>
        </div>
      </div>

      <div v-if="isAdminOrOwner && !isPublic" class="hidden w-full lg:w-1/3 lg:flex flex-col gap-4">
        <CommunityJoinRequests :communitySlug="community.slug" @requestHandled="onRequestHandled" />
      </div>
    </div>
  </template>
</template>
