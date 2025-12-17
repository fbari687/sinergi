<script setup>
import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import PostCard from "@/components/Posts/PostCard.vue"; // Gunakan PostCard asli
import CreatePost from "@/components/Posts/CreatePost.vue"; // Untuk Admin buat post
import PostCardSkeleton from "@/components/Posts/PostCardSkeleton.vue";
import { ref, onMounted, onUnmounted, watch } from "vue";
import postApi from "@/services/postApi";
import { useToast } from "primevue";
import _ from "lodash";

const toast = useToast();

const posts = ref([]);
const loading = ref(true);
const loadingNextPage = ref(false);

const page = ref(1);
const hasMore = ref(true);
const searchQuery = ref("");
const loadTrigger = ref(null);
const observer = ref(null);

const loadPosts = async (isReset = false) => {
  if (isReset) {
    loading.value = true;
    page.value = 1;
    hasMore.value = true;
    posts.value = [];
  }

  if (!isReset && (loadingNextPage.value || !hasMore.value)) return;
  if (!isReset) loadingNextPage.value = true;

  try {
    // Gunakan endpoint global/admin
    const response = await postApi.getAllPostHome(page.value, searchQuery.value);
    const newPosts = response.data.data?.data || response.data.data || [];

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
  } catch (error) {
    console.error("Gagal memuat postingan:", error);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat feed." });
  } finally {
    loading.value = false;
    loadingNextPage.value = false;
  }
};

const handleSearch = _.debounce(() => {
  loadPosts(true);
}, 500);

// Handler Hapus Post (Diterima dari emit PostCard -> PostOptionsPopover)
const handleDeletePost = async (postId) => {
  // Logic delete sudah ada di backend admin delete (atau gunakan endpoint delete biasa jika role admin diizinkan)
  try {
    await postApi.deletePost(postId);
    const index = posts.value.findIndex((p) => p.id === postId);
    if (index !== -1) posts.value.splice(index, 1);
    // Toast sudah dihandle di Popover atau bisa disini juga
  } catch (err) {
    console.error("Gagal hapus:", err);
  }
};

// Handler jika Admin membuat post baru
const handlePostCreated = () => {
  loadPosts(true);
};

const handlePostUpdated = () => {
  loadPosts(true);
};

// Handler Update Jumlah Komentar (jika admin menghapus komentar di dalam dialog)
const handleChangeCommentCount = (postId, count) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post) post.comment_count = count;
};

// Intersection Observer
onMounted(() => {
  loadPosts(true);
  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMore.value && !loading.value && !loadingNextPage.value) {
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
  <LayoutAdminUser>
    <div class="w-full max-w-full pt-4 md:pt-0 md:mt-24 px-4 md:px-8 flex flex-col items-center">
      <div class="w-full max-w-[700px] mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Feed Global</h1>
        <p class="text-sm text-gray-500 mt-1">Pantau seluruh aktivitas dan buat pengumuman.</p>
      </div>

      <div class="w-full max-w-[700px] mb-6">
        <CreatePost @postCreated="handlePostCreated" />
      </div>

      <div class="w-full max-w-[700px] mb-4 relative">
        <div class="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
          <i class="fas fa-search text-gray-400"></i>
        </div>
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Cari postingan user..."
          class="w-full p-3 ps-10 text-sm text-gray-900 border border-gray-300 rounded-xl bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
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
        <template v-if="loading">
          <PostCardSkeleton v-for="n in 3" :key="n" />
        </template>

        <template v-else>
          <template v-if="posts.length === 0">
            <div class="bg-white border border-gray-200 rounded-xl p-8 mt-2 text-center text-gray-500 w-full shadow-sm">
              <p>Belum ada postingan.</p>
            </div>
          </template>

          <template v-else>
            <PostCard v-for="post in posts" :key="post.id" :post="post" :isAdminView="true" @deletePost="handleDeletePost" @refreshCommunity="handlePostCreated" @changeCommentCount="handleChangeCommentCount" />

            <div ref="loadTrigger" class="h-16 flex items-center justify-center w-full mt-4">
              <i v-if="loadingNextPage" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
              <span v-else-if="!hasMore" class="text-gray-400 text-sm"> Semua data telah dimuat. </span>
            </div>
          </template>
        </template>
      </div>
    </div>
  </LayoutAdminUser>
</template>
