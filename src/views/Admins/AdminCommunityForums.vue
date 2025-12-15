<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import forumApi from "@/services/forumApi";
import ForumCard from "@/components/Forums/ForumCard.vue";
import _ from "lodash";

const props = defineProps(["community"]);
const forums = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const page = ref(1);
const hasMore = ref(true);

const loadForums = async (isReset = false) => {
  if (isReset) {
    loading.value = true;
    page.value = 1;
    hasMore.value = true;
    forums.value = [];
  }

  try {
    const res = await forumApi.getForums(props.community.slug, searchQuery.value, page.value);
    const newForums = res.data.data;

    if (newForums.length === 0) {
      hasMore.value = false;
    } else {
      if (newForums.length < 10) hasMore.value = false;

      if (isReset) forums.value = newForums;
      else forums.value.push(...newForums);

      if (hasMore.value) page.value++;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = _.debounce(() => {
  loadForums(true);
}, 500);

// Observer
const observer = ref(null);
const loadTrigger = ref(null);

onMounted(() => {
  loadForums(true);

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadForums();
      }
    },
    { rootMargin: "200px" }
  );
});

watch(loadTrigger, (el) => {
  if (el && observer.value) observer.value.observe(el);
});
</script>

<template>
  <div class="w-full flex flex-col gap-4 pb-20">
    <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h2 class="font-bold text-xl text-gray-900">Forum Diskusi (Admin View)</h2>
        <p class="text-sm text-gray-500">Pantau diskusi komunitas.</p>
      </div>
    </div>

    <div class="relative w-full">
      <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
      <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Cari topik diskusi..." class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
    </div>

    <div class="flex flex-col gap-3">
      <div v-if="loading && page === 1" class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500"></i> Memuat...</div>

      <div v-else-if="forums.length === 0" class="text-center py-10 bg-white rounded-xl border border-gray-200">
        <p class="text-gray-500">Belum ada topik diskusi.</p>
      </div>

      <template v-else>
        <ForumCard v-for="forum in forums" :key="forum.id" :forum="forum" :communitySlug="props.community.slug" :isAdminView="true" />

        <div ref="loadTrigger" class="h-10 flex items-center justify-center w-full mt-2">
          <i v-if="hasMore" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
        </div>
      </template>
    </div>
  </div>
</template>
