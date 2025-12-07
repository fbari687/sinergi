<script setup>
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import PostCard from "@/components/Posts/PostCard.vue";
import CreatePost from "@/components/Posts/CreatePost.vue";
import { ref, onMounted, onUnmounted, watch } from "vue";
import postApi from "@/services/postApi";
import likeApi from "@/services/likeApi";
import PostCardSkeleton from "@/components/Posts/PostCardSkeleton.vue";
import _ from "lodash"; // 1. Import Lodash untuk debounce

const posts = ref([]);

// State Loading
const loading = ref(true); // Loading Awal (Skeleton)
const loadingNextPage = ref(false); // Loading Scroll Bawah (Spinner)

// State Pagination & Search
const page = ref(1);
const hasMore = ref(true);
const searchQuery = ref(""); // 2. State Search Query
const loadTrigger = ref(null);
const observer = ref(null);

// Fungsi Load Data (Bisa Reset Awal atau Next Page)
const loadPosts = async (isReset = false) => {
  // 1. Jika Reset (misal habis create/edit post atau SEARCH), kembalikan ke awal
  if (isReset) {
    loading.value = true;
    page.value = 1;
    hasMore.value = true;
    posts.value = [];
  }

  // 2. Guard: Jangan fetch jika sedang loading page selanjutnya atau data habis
  if (!isReset && (loadingNextPage.value || !hasMore.value)) return;

  // 3. Set spinner bawah aktif jika bukan reset
  if (!isReset) loadingNextPage.value = true;

  try {
    // 3. Update API Call: Kirim searchQuery sebagai parameter kedua
    // Pastikan postApi.getAllPostHome dimodifikasi untuk menerima (page, search)
    const response = await postApi.getAllPostHome(page.value, searchQuery.value);
    const newPosts = response.data.data;

    if (newPosts.length === 0) {
      hasMore.value = false;
    } else {
      // Cek jika data yang diterima kurang dari limit (misal 5), berarti ini page terakhir
      if (newPosts.length < 5) {
        hasMore.value = false;
      }

      if (isReset) {
        posts.value = newPosts;
      } else {
        posts.value.push(...newPosts); // Append data baru ke bawah
      }

      // Siapkan page berikutnya
      if (hasMore.value) {
        page.value++;
      }
    }
  } catch (error) {
    console.error("Gagal memuat postingan: ", error);
  } finally {
    loading.value = false;
    loadingNextPage.value = false;
  }
};

// 4. Logic Pencarian (Debounce 500ms)
const handleSearch = _.debounce(() => {
  loadPosts(true); // Load ulang dari page 1 dengan query baru
}, 500);

const handleToggleLike = async (postId) => {
  try {
    await likeApi.likePost(postId);
    const post = posts.value.find((p) => p.id === postId);
    if (post) {
      if (post.is_liked_by_user) {
        post.like_count -= 1;
      } else {
        post.like_count += 1;
      }
      post.is_liked_by_user = !post.is_liked_by_user;
    }
  } catch (err) {
    console.error("Gagal like post: ", err);
  }
};

const handleChangeCommentCount = async (postId, countComment) => {
  const post = posts.value.find((p) => p.id === postId);
  if (post) {
    post.comment_count = countComment;
  }
};

const handleDeletePost = async (postId) => {
  try {
    await postApi.deletePost(postId);
    const postIndex = posts.value.findIndex((p) => p.id === postId);
    if (postIndex !== -1) {
      posts.value.splice(postIndex, 1);
    }
  } catch (err) {
    console.error("Gagal menghapus post: ", err);
  }
};

// Handler ketika post berhasil diedit
const handlePostUpdated = () => {
  // Reload data dari awal agar perubahan (deskripsi/gambar) terlihat
  loadPosts(true);
};

onMounted(() => {
  // 1. Load Data Awal
  loadPosts(true);

  // 2. Setup Intersection Observer
  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      // Jika elemen terlihat, data masih ada, dan tidak sedang loading
      if (entry.isIntersecting && hasMore.value && !loading.value && !loadingNextPage.value) {
        loadPosts(); // Load next page
      }
    },
    { rootMargin: "200px" } // Load sebelum mentok bawah 200px
  );
});

// Watcher untuk memasang observer ke elemen trigger jika render terlambat
watch(loadTrigger, (el) => {
  if (el && observer.value) {
    observer.value.observe(el);
  }
});

onUnmounted(() => {
  if (observer.value) observer.value.disconnect();
});
</script>

<template>
  <LayoutDefaultUser>
    <main class="grow w-full flex flex-col items-center justify-center max-w-[600px] lg:max-w-[690px] pt-4 md:pt-0 md:mt-20 pb-20">
      <CreatePost v-if="!searchQuery" @postCreated="() => loadPosts(true)" />

      <div class="w-full mb-4 relative mt-2 px-1 lg:px-0">
        <div class="absolute inset-y-0 start-0 flex items-center ps-4 lg:ps-4 pointer-events-none">
          <i class="fas fa-search text-gray-400"></i>
        </div>
        <input
          type="text"
          v-model="searchQuery"
          @input="handleSearch"
          placeholder="Cari postingan di beranda..."
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

      <template v-if="loading">
        <PostCardSkeleton v-for="n in 3" :key="n" />
      </template>

      <template v-else>
        <template v-if="posts.length === 0">
          <div class="bg-white border border-gray-200 rounded-xl p-8 mt-2 text-center text-gray-500 w-full shadow-sm">
            <i class="fas fa-search text-4xl mb-3 text-gray-300"></i>
            <p v-if="searchQuery">
              Tidak ditemukan postingan untuk kata kunci "<b>{{ searchQuery }}</b
              >".
            </p>
            <p v-else>Belum ada postingan di homepage ini.</p>
          </div>
        </template>

        <template v-else>
          <div v-if="searchQuery" class="w-full mb-4 text-sm text-gray-500 px-1">
            Menampilkan hasil pencarian untuk "<b>{{ searchQuery }}</b
            >"
          </div>

          <PostCard v-for="post in posts" :key="post.id" :post="post" @toggleLike="handleToggleLike" @deletePost="handleDeletePost" @changeCommentCount="handleChangeCommentCount" @refreshCommunity="handlePostUpdated" />

          <div ref="loadTrigger" class="h-16 flex items-center justify-center w-full mt-4">
            <i v-if="loadingNextPage" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
            <span v-else-if="!hasMore" class="text-gray-400 text-sm"> Semua postingan telah dimuat. </span>
          </div>
        </template>
      </template>
    </main>
  </LayoutDefaultUser>
</template>

<style scoped></style>
