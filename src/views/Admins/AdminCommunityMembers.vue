<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import memberApi from "@/services/memberApi";
import CommunityMembersTile from "@/components/Communities/CommunityMembersTile.vue";
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

const loadTrigger = ref(null);
const observer = ref(null);

const loadData = async (isReset = false) => {
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
  loadData(true);
}, 500);

const onRefresh = () => {
  loadData(true);
};

onMounted(() => {
  loadData(true);

  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loading.value) {
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
  <div class="w-full flex flex-col gap-4 items-start pt-2">
    <div class="w-full bg-white border border-gray-200 rounded-xl p-5">
      <h2 class="font-bold text-lg text-gray-900">Total Anggota: {{ (meta.total_members + meta.total_admins).toLocaleString("id-ID") }}</h2>
    </div>

    <div class="relative w-full">
      <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
      <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Cari anggota..." class="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-blue-200 outline-none" />
    </div>

    <div v-if="admins.length > 0" class="w-full bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="font-bold text-gray-900 mb-2">Admin & Moderator · {{ meta.total_admins }}</h3>
      <CommunityMembersTile v-for="admin in admins" :key="admin.id" :isAdminView="true" :member="admin" :currentUserRole="'ADMIN'" :communitySlug="community.slug" @refresh="onRefresh" />
    </div>

    <div class="w-full bg-white border border-gray-200 rounded-xl p-5">
      <h3 class="font-bold text-gray-900 mb-2">Anggota · {{ meta.total_members.toLocaleString("id-ID") }}</h3>
      <div v-if="members.length === 0 && !loading" class="text-center py-8 text-gray-400">Tidak ada anggota ditemukan.</div>

      <CommunityMembersTile v-for="member in members" :key="member.id" :member="member" :currentUserRole="'ADMIN'" :communitySlug="community.slug" @refresh="onRefresh" />

      <div ref="loadTrigger" class="w-full py-4 flex justify-center">
        <i v-if="loading" class="fa-solid fa-circle-notch fa-spin text-blue-600"></i>
      </div>
    </div>
  </div>
</template>
