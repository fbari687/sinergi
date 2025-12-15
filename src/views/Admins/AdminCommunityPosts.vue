<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import PostCardSkeleton from "@/components/Posts/PostCardSkeleton.vue";
import postApi from "@/services/postApi";
import PostCard from "@/components/Posts/PostCard.vue";
import { useToast } from "primevue";
import _ from "lodash";

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});

const toast = useToast();
const posts = ref([]);
const loadingPosts = ref(true);
const loadingNextPage = ref(false);

// Pagination
const page = ref(1);
const hasMore = ref(true);
const searchQuery = ref("");
const loadTrigger = ref(null);
const observer = ref(null);

const loadPosts = async (isReset = false) => {
  if (isReset) {
    loadingPosts.value = true;
    page.value = 1;
    hasMore.value = true;
    posts.value = [];
  }

  if (!isReset && (loadingNextPage.value || !hasMore.value)) return;
  if (!isReset) loadingNextPage.value = true;

  try {
    // Admin request ke endpoint yang sama (backend harus handle jika admin akses private community)
    // Atau gunakan endpoint khusus admin jika backend membatasi getAllPostCommunities untuk non-member
    const response = await postApi.getAllPostCommunities(props.community.slug, page.value, searchQuery.value);
    const newPosts = response.data.data;

    if (newPosts.length === 0) {
      hasMore.value = false;
    } else {
      if (newPosts.length < 5) hasMore.value = false;

      if (isReset) {
        posts.value = newPosts;
      } else {
        posts.value.push(...newPosts);
      }

      if (hasMore.value) page.value++;
    }
  } catch (err) {
    console.error("Gagal memuat post admin", err);
  } finally {
    loadingPosts.value = false;
    loadingNextPage.value = false;
  }
};

const handleSearch = _.debounce(() => {
  loadPosts(true);
}, 500);

const handleDeletePost = async (postId) => {
  // Handler Hapus Admin (Logic backend admin delete)
  try {
    await postApi.deletePost(postId);
    const index = posts.value.findIndex((p) => p.id === postId);
    if (index !== -1) posts.value.splice(index, 1);
    toast.add({ severity: "success", summary: "Terhapus", detail: "Postingan dihapus admin." });
  } catch (err) {
    console.error(err);
  }
};

const handleChangeCommentCount = (postId, count) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post) post.comment_count = count;
};

// Intersection Observer
onMounted(() => {
  loadPosts(true); // Langsung load tanpa cek akses

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore.value && !loadingPosts.value && !loadingNextPage.value) {
        loadPosts();
      }
    },
    { rootMargin: "200px" }
  );
});

watch(loadTrigger, (el) => {
  if (el && observer.value) observer.value.observe(el);
});

onUnmounted(() => {
  if (observer.value) observer.value.disconnect();
});
</script>

<template>
  <div class="w-full grow flex flex-col items-center">
    <div class="w-full max-w-[700px] mb-4 relative">
      <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
        <i class="fas fa-search text-gray-400"></i>
      </div>
      <input
        type="text"
        v-model="searchQuery"
        @input="handleSearch"
        placeholder="Cari postingan di komunitas ini..."
        class="w-full p-3 ps-10 text-sm text-gray-900 border border-gray-200 rounded-xl bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
      />
      <button
        v-if="searchQuery"
        @click="
          searchQuery = '';
          handleSearch();
        "
        class="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="w-full max-w-[700px] flex flex-col gap-4 pb-20">
      <template v-if="loadingPosts">
        <PostCardSkeleton v-for="n in 3" :key="n" />
      </template>

      <template v-else>
        <div v-if="posts.length === 0" class="bg-white border border-gray-200 rounded-xl p-8 mt-5 text-center text-gray-500">
          <p>Belum ada postingan di komunitas ini.</p>
        </div>

        <template v-else>
          <PostCard v-for="post in posts" :key="post.id" :post="post" :isAdminView="true" @deletePost="handleDeletePost" @changeCommentCount="handleChangeCommentCount" />

          <div ref="loadTrigger" class="h-16 flex items-center justify-center w-full mt-2">
            <i v-if="loadingNextPage" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
            <span v-else-if="!hasMore" class="text-gray-400 text-sm"> Semua postingan telah dimuat. </span>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
