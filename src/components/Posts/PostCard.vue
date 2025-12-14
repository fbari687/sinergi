<script setup>
import NumberFlow from "@number-flow/vue";
import { onMounted, onUnmounted, ref, computed } from "vue";
import { formatIndonesianDate, formatTimeAgo } from "@/utils/formatDate";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "vue-router";
import PostOptionsPopover from "./PostOptionsPopover.vue";
import PostCommentDialog from "./PostCommentDialog.vue";
import Image from "primevue/image";

const authStore = useAuthStore();
const router = useRouter();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  isShowInteractivity: {
    type: Boolean,
    required: false,
    default: true,
  },
});

// PERBAIKAN: Menambahkan 'refreshCommunity' ke dalam array defineEmits
const emit = defineEmits(["toggleLike", "deletePost", "changeCommentCount", "refreshCommunity"]);

const visible = ref(false);

const mql = window.matchMedia("(max-width: 767px)");
const isMobile = ref(mql.matches);

const handleMqlChange = (e) => {
  isMobile.value = e.matches;
};

onMounted(() => {
  mql.addEventListener("change", handleMqlChange);
});

onUnmounted(() => {
  mql.addEventListener("change", handleMqlChange);
});

const handleLike = () => {
  emit("toggleLike", props.post.id);
};

const handleDeletePost = (postId) => {
  emit("deletePost", postId);
};

const handleChangeCommentCount = (postId, count) => {
  emit("changeCommentCount", postId, count);
};

const handleCommentClick = () => {
  if (isMobile.value) {
    router.push(`/post/${props.post.id}`);
  } else {
    visible.value = true;
  }
};

const isContentLong = computed(() => {
  if (!props.post.description) return false;
  const textContent = props.post.description.replace(/<[^>]*>/g, "");
  return textContent.length > 200;
});

// Handler saat post di-update dari PostOptionsPopover -> EditPost
const handlePostUpdated = () => {
  // Meneruskan sinyal ke Parent (HomePage / CommunityPage) untuk refresh data
  emit("refreshCommunity");
};
const getRoleColor = (role) => {
  switch (role) {
    case "Admin":
      return "bg-gray-800 text-white";
    case "Dosen":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Mahasiswa":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Alumni":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Mitra":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Pakar":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};
</script>

<template>
  <article class="w-full bg-white border border-gray-200 rounded-xl mb-5">
    <!-- Header Card -->
    <div class="flex items-start p-4">
      <RouterLink :to="`/profile/${post.user.username}`">
        <img :src="post.user.profile_picture" alt="Profile" class="w-12 h-12 rounded-full mr-3 object-cover" />
      </RouterLink>
      <div class="grow">
        <RouterLink :to="`/profile/${post.user.username}`" class="flex items-center w-fit gap-1 text-base text-black font-bold m-0 border-b border-b-transparent transition duration-150 hover:border-b-black">
          <span>
            {{ post.user.username }}
          </span>
          <span v-if="post.user.id != authStore.user.id" class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full" :class="getRoleColor(post.user.role)">
            {{ post.user.role }}
          </span>
          <span v-else class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full" :class="getRoleColor('default')"> Anda </span>
        </RouterLink>
        <p class="text-xs text-gray-500 mt-1 m-0">{{ post.is_edited ? formatIndonesianDate(post.created_at) + ` (Telah disunting ${formatTimeAgo(post.updated_at)})` : formatTimeAgo(post.created_at) }}</p>
      </div>

      <!-- Popover Menu (Edit/Delete) -->
      <PostOptionsPopover :post="post" @deletePost="handleDeletePost" @postUpdated="handlePostUpdated" />
    </div>

    <!-- Konten Card -->
    <div class="px-4 pb-4 pt-0 text-sm text-black leading-relaxed">
      <div class="wrap-break-word" :class="{ 'line-clamp-3': isContentLong }" v-html="post.description"></div>

      <button v-if="isContentLong" @click.stop="handleCommentClick" class="mt-1 text-blue-600 hover:text-blue-800 font-semibold bg-transparent border-none p-0 cursor-pointer text-sm">Lihat Selengkapnya</button>

      <template v-if="post.media_url != null">
        <div class="w-full mt-3 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center h-[586px] max-h-[586px] bg-gray-200 group-[.no-image]:hidden">
          <Image :src="post.media_url" alt="Gambar Pstingan" preview imageClass="h-full max-h-full w-auto object-contain" />
        </div>
      </template>
    </div>

    <div class="flex justify-around px-4 py-2 border-t border-gray-200">
      <template v-if="isShowInteractivity">
        <button @click="handleLike" type="button" class="w-20 bg-transparent border-none cursor-pointer text-sm text-gray-600 flex gap-2 items-center justify-center group">
          <i
            :class="
              post.is_liked_by_user
                ? 'fa-solid fa-heart text-lg rounded-full transition-colors duration-300 text-pink-600 group-hover:bg-pink-100 p-2'
                : 'fa-regular fa-heart text-lg rounded-full transition-colors duration-300 text-gray-600 group-hover:bg-pink-100 p-2'
            "
          ></i>
          <span class="w-10 text-start"><NumberFlow :value="post.like_count" /></span>
        </button>
        <button @click="handleCommentClick" type="button" class="w-20 bg-transparent border-none cursor-pointer text-sm text-gray-600 flex gap-2 items-center justify-center group">
          <i class="fa-regular fa-comment text-lg rounded-full transition-colors duration-300 text-gray-600 group-hover:bg-gray-200 p-2"></i>
          <span class="w-10 text-start"><NumberFlow :value="post.comment_count" /></span>
        </button>
      </template>
      <template v-if="!isShowInteractivity">
        <div class="text-sm cursor-default">Bergabung dengan komunitas untuk like dan komentar.</div>
      </template>
    </div>
  </article>

  <PostCommentDialog :post="post" v-model:visible="visible" @changeCommentCount="handleChangeCommentCount" @toggleLike="handleLike" @deletePost="handleDeletePost" />
</template>

<style scoped></style>
