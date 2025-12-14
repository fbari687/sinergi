<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import CreatePost from "@/components/Posts/CreatePost.vue";
import PostCardSkeleton from "@/components/Posts/PostCardSkeleton.vue";
import postApi from "@/services/postApi";
import communityApi from "@/services/communityApi";
import PostCard from "@/components/Posts/PostCard.vue";
import likeApi from "@/services/likeApi";
import { useToast } from "primevue";
import _ from "lodash";
import { useAuthStore } from "@/store/auth";

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["refreshCommunity"]);

const toast = useToast();
const authStore = useAuthStore();
const posts = ref([]);
const loadingPosts = ref(true);
const loadingNextPage = ref(false);
const canViewPosts = ref(false);
const canCreatePosts = ref(false);

// State Pagination & Search
const page = ref(1);
const hasMore = ref(true);
const searchQuery = ref("");
const loadTrigger = ref(null);
const observer = ref(null);

const isJoining = ref(false);

// --- MODIFIKASI 1: DEFINISIKAN ADMIN ---
// Helper computed agar mudah dipakai di template dan script
const isAdmin = computed(() => {
  return authStore.user?.role === "Admin"; // Sesuaikan casing jika di DB 'ADMIN'
});

// --- MODIFIKASI 2: LOGIKA GUEST ---
// Admin tidak boleh dianggap Guest, agar tidak terkena limit 5 postingan
const isGuest = computed(() => {
  if (isAdmin.value) return false; // Admin bebas akses
  return props.community.is_public && props.community.user_membership_status !== "GRANTED";
});

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
    const response = await postApi.getAllPostCommunities(props.community.slug, page.value, searchQuery.value);
    const newPosts = response.data.data;

    if (newPosts.length === 0) {
      hasMore.value = false;
    } else {
      if (newPosts.length < 5) {
        hasMore.value = false;
      }

      if (isReset) {
        posts.value = newPosts;
      } else {
        posts.value.push(...newPosts);
      }

      // Logic limit guest tetap jalan untuk user biasa, tapi Admin di-bypass via computed isGuest
      if (isGuest.value && posts.value.length >= 5) {
        hasMore.value = false;
      } else if (hasMore.value) {
        page.value++;
      }
    }
  } catch (err) {
    console.error("Gagal memuat post", err);
  } finally {
    loadingPosts.value = false;
    loadingNextPage.value = false;
  }
};

const handleSearch = _.debounce(() => {
  loadPosts(true);
}, 500);

const handleJoin = async () => {
  isJoining.value = true;
  try {
    await communityApi.joinCommunity(props.community.slug);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Anda berhasil bergabung!", life: 3000 });
    emit("refreshCommunity");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal bergabung komunitas.", life: 3000 });
  } finally {
    isJoining.value = false;
  }
};

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

// --- MODIFIKASI 3: PERIZINAN ---
const checkRoleInCommunity = () => {
  const isPublic = props.community.is_public;
  const isMember = props.community.user_membership_status === "GRANTED";

  // Logic View: Publik ATAU Member ATAU Admin
  if (isPublic || isMember || isAdmin.value) {
    canViewPosts.value = true;
    loadPosts(true);
  } else {
    canViewPosts.value = false;
    loadingPosts.value = false;
  }

  // Logic Create: Member ATAU Admin
  if (isMember) {
    canCreatePosts.value = true;
  } else {
    canCreatePosts.value = false;
  }
};

onMounted(() => {
  checkRoleInCommunity();

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
  if (el && observer.value) {
    observer.value.observe(el);
  }
});

onUnmounted(() => {
  if (observer.value) observer.value.disconnect();
});
</script>

<template>
  <div class="w-full grow xl:w-3/5 flex flex-col items-center justify-center max-w-[600px] lg:max-w-[690px] pt-4 lg:pt-2">
    <template v-if="canViewPosts">
      <CreatePost v-if="canCreatePosts && !searchQuery" :communitySlug="community?.slug" :communityName="community?.name" @postCreated="() => loadPosts(true)" />

      <div v-if="canCreatePosts" class="w-full mb-4 relative">
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

      <template v-if="loadingPosts">
        <PostCardSkeleton v-for="n in 3" :key="n" />
      </template>

      <template v-else>
        <div v-if="posts.length === 0" class="bg-white border border-gray-200 rounded-xl p-8 mt-5 text-center text-gray-500">
          <i class="fas fa-search text-4xl mb-3 text-gray-300"></i>
          <p v-if="searchQuery">
            Tidak ditemukan postingan dengan kata kunci "<b>{{ searchQuery }}</b
            >".
          </p>
          <p v-else>Belum ada postingan di komunitas ini.</p>
        </div>

        <template v-else>
          <div v-if="searchQuery" class="w-full mb-4 text-sm text-gray-500 px-1">
            Menampilkan hasil pencarian untuk "<b>{{ searchQuery }}</b
            >"
          </div>

          <PostCard
            v-for="post in posts"
            :isShowInteractivity="community.user_membership_status === 'GRANTED' || isAdmin"
            :key="post.id"
            :post="post"
            @toggleLike="handleToggleLike"
            @deletePost="handleDeletePost"
            @changeCommentCount="handleChangeCommentCount"
          />

          <div v-if="isGuest && posts.length >= 5" class="w-full bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-center shadow-sm">
            <i class="fa-solid fa-layer-group text-3xl text-blue-500 mb-3"></i>
            <h3 class="font-bold text-gray-900 text-lg">Ingin melihat lebih banyak?</h3>
            <p class="text-sm text-gray-600 mb-4">
              Bergabung dengan komunitas <b>{{ community.name }}</b> untuk mengakses seluruh postingan, berinteraksi, dan berdiskusi.
            </p>

            <button
              @click="handleJoin"
              :disabled="isJoining"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              <i v-if="isJoining" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isJoining ? "Bergabung..." : "Gabung Komunitas" }}</span>
            </button>
          </div>

          <div v-else ref="loadTrigger" class="h-16 flex items-center justify-center w-full mt-2">
            <i v-if="loadingNextPage" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
            <span v-else-if="!hasMore && posts.length > 0" class="text-gray-400 text-sm"> Semua postingan telah dimuat. </span>
          </div>
        </template>
      </template>
    </template>

    <template v-else>
      <div class="bg-white border border-gray-200 rounded-xl p-6 mt-5 text-center text-gray-500">
        <i class="fas fa-lock text-3xl mb-4"></i>
        <h4 class="font-bold text-base">Komunitas Ini Privat</h4>
        <p class="text-sm">Anda harus menjadi anggota untuk melihat postingan.</p>
      </div>
    </template>
  </div>

  <div class="hidden xl:w-2/5 lg:flex flex-col gap-2 pt-4 lg:pt-2">
    <div class="w-full bg-white border border-gray-200 rounded-xl mb-5 flex flex-col gap-2 px-4 py-2">
      <span class="font-bold">Tentang</span>
      <p v-html="community?.about" class="prose prose-sm prose-a:text-blue-600 w-full wrap-break-word"></p>
    </div>
  </div>
</template>
