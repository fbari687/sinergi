<script setup>
import { useAuthStore } from "@/store/auth";
import commentApi from "@/services/commentApi";
import { onMounted, provide, ref, watch } from "vue";
import { Button, useToast } from "primevue";
import CommentTile from "@/components/Comments/CommentTile.vue";
import CommentTileSkeleton from "@/components/Comments/CommentTileSkeleton.vue";
import { formatTimeAgo, formatIndonesianDate } from "@/utils/formatDate";
import NumberFlow from "@number-flow/vue";
import PostOptionsPopover from "./PostOptionsPopover.vue";
import Image from "primevue/image";
import { RouterLink } from "vue-router";

const authStore = useAuthStore();
const toast = useToast();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  isAdminView: { type: Boolean, default: false },
});

const emit = defineEmits(["changeCommentCount", "toggleLike", "handleDelete"]);

const comments = ref([]);
const loadingLoadComment = ref(true);
const loadingSendComment = ref(false);
const commentMessage = ref("");
const inputRef = ref(null);
const replyingTo = ref(null);

const refreshSignal = ref(null);
provide("refreshSignal", refreshSignal);

// STATE UTAMA: Gunakan jumlah dari props sebagai nilai awal yang benar
const currentCommentCount = ref(props.post.comment_count || 0);

// --- FUNGSI LOGIKA KOMENTAR ---

const loadComments = async () => {
  if (comments.value.length === 0) loadingLoadComment.value = true;

  try {
    const response = await commentApi.getCommentsByPostId(props.post.id);
    comments.value = response.data.data;

    // [HAPUS BAGIAN INI]
    // Jangan hitung ulang di sini, karena reply_count backend tidak rekursif sampai cucu.
    // Biarkan currentCommentCount tetap memakai nilai dari PostCard/Props.
  } catch (error) {
    console.error("Gagal memuat komentar: ", error);
  } finally {
    loadingLoadComment.value = false;
  }
};

const handleDeleteComment = async (commentId) => {
  try {
    await commentApi.deleteComment(commentId);

    // Update UI List
    await loadComments();

    // Update Count Manual (Kurangi 1)
    currentCommentCount.value = Math.max(0, currentCommentCount.value - 1);
    emit("changeCommentCount", props.post.id, currentCommentCount.value);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Komentar dihapus", life: 3000 });
  } catch (err) {
    console.error("Gagal menghapus comment: ", err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus komentar", life: 3000 });
  }
};

const handleSetReply = ({ comment, username }) => {
  replyingTo.value = {
    id: comment.id,
    username: username,
  };
  if (inputRef.value) inputRef.value.focus();
};

const cancelReply = () => {
  replyingTo.value = null;
  commentMessage.value = "";
};

const handleSubmitComment = async () => {
  if (!commentMessage.value.trim()) return;
  loadingSendComment.value = true;

  try {
    const formData = new FormData();
    formData.append("content", commentMessage.value);

    const targetReplyId = replyingTo.value ? replyingTo.value.id : null;

    if (replyingTo.value) {
      await commentApi.replyComment(formData, replyingTo.value.id);
      toast.add({ severity: "success", summary: "Terkirim", detail: "Balasan berhasil dikirim", life: 3000 });

      refreshSignal.value = {
        commentId: targetReplyId,
        timestamp: Date.now(),
      };
    } else {
      await commentApi.createComment(formData, props.post.id);
      toast.add({ severity: "success", summary: "Terkirim", detail: "Komentar berhasil dikirim", life: 3000 });
    }

    // Update Count Manual (Tambah 1)
    currentCommentCount.value++;
    emit("changeCommentCount", props.post.id, currentCommentCount.value);

    // Reset Form & Reload List
    commentMessage.value = "";
    replyingTo.value = null;
    await loadComments();
  } catch (err) {
    console.error("Gagal komentar: ", err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengirim komentar", life: 3000 });
  } finally {
    loadingSendComment.value = false;
  }
};

const handleLike = () => {
  emit("toggleLike", props.post.id);
};

const deletePost = () => {
  emit("handleDelete", props.post.id);
};

// Watcher: Jika props di luar berubah (misal real-time update), sinkronkan
watch(
  () => props.post.comment_count,
  (newVal) => {
    // Hanya update jika perbedaannya signifikan (untuk menghindari overwrite update lokal kita)
    if (newVal !== currentCommentCount.value) {
      currentCommentCount.value = newVal;
    }
  }
);

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

onMounted(loadComments);
</script>

<template>
  <div class="flex flex-col h-full bg-white relative">
    <div class="flex-1 p-4 space-y-6 overflow-y-auto pb-24">
      <div>
        <div class="flex items-start">
          <RouterLink :to="isAdminView ? '' : `/profile/${post.user.username}`">
            <img :src="post.user.profile_picture" alt="Profile" class="w-12 h-12 rounded-full mr-3 object-cover" />
          </RouterLink>
          <div class="grow">
            <RouterLink :to="isAdminView ? '' : `/profile/${post.user.username}`" class="flex items-center w-fit gap-1 text-base text-black font-bold m-0 border-b border-b-transparent transition duration-150 hover:border-b-black">
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
          <PostOptionsPopover :post="post" @deletePost="deletePost" :isAdminView="isAdminView" />
        </div>

        <div class="pt-2 text-sm leading-relaxed">
          <p class="w-full" v-html="post.description"></p>
          <template v-if="post.media_url != null">
            <div class="w-full mt-3 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center h-[586px] max-h-[586px] bg-gray-200 group-[.no-image]:hidden">
              <Image :src="post.media_url" alt="Gambar Postingan" preview imageClass="h-full max-h-full w-auto object-contain" />
            </div>
          </template>
        </div>

        <div v-if="!isAdminView" class="flex justify-around px-4 py-2 border-t border-b mt-4">
          <button @click="handleLike" type="button" class="w-20 bg-transparent border-none cursor-pointer text-sm text-gray-600 flex gap-2 items-center justify-center group">
            <i :class="post.is_liked_by_user ? 'fa-solid fa-heart text-lg text-pink-600' : 'fa-regular fa-heart text-lg text-gray-600'"></i>
            <span class="w-10 text-start"><NumberFlow :value="post.like_count" /></span>
          </button>

          <button type="button" class="w-20 bg-transparent border-none cursor-pointer text-sm text-gray-600 flex gap-2 items-center justify-center">
            <i class="fa-regular fa-comment text-lg p-2"></i>
            <span class="w-10 text-start"><NumberFlow :value="currentCommentCount" /></span>
          </button>
        </div>
        <div v-if="isAdminView" class="px-4 py-2 border-b"></div>
      </div>

      <div class="space-y-4">
        <h5 class="text-base font-semibold text-gray-800">Komentar</h5>

        <template v-if="loadingLoadComment">
          <CommentTileSkeleton v-for="n in 3" :key="n" />
        </template>
        <template v-else>
          <template v-if="comments.length === 0">
            <p class="text-gray-500 text-sm italic">Belum ada komentar.</p>
          </template>
          <template v-else>
            <CommentTile v-for="comment in comments" :key="comment.id" :comment="comment" :isAdminView="isAdminView" @deleteComment="handleDeleteComment" @setReply="handleSetReply" />
          </template>
        </template>
      </div>
    </div>

    <div class="fixed left-0 w-full bottom-0 z-20 flex items-center justify-center" v-if="!isAdminView">
      <div class="block w-full lg:max-w-[690px] bg-white border-t">
        <div v-if="replyingTo" class="px-4 py-2 bg-gray-100 flex justify-between items-center text-sm border-b">
          <span class="text-gray-600">
            Membalas <span class="font-bold text-blue-600">@{{ replyingTo.username }}</span>
          </span>
          <button @click="cancelReply" class="text-gray-500 hover:text-red-500 font-bold">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="p-4 bg-gray-50">
          <form @submit.prevent="handleSubmitComment" class="flex items-center justify-between gap-3">
            <img :src="authStore.user.profile_picture" alt="My Profile" class="w-10 h-10 rounded-full object-cover" />
            <input
              ref="inputRef"
              type="text"
              name="content"
              v-model="commentMessage"
              :disabled="loadingSendComment"
              :placeholder="replyingTo ? `Balas @${replyingTo.username}...` : 'Tulis komentar...'"
              class="flex-1 border border-gray-300 rounded-full pl-4 pr-2 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all"
            />
            <Button
              type="submit"
              icon="pi pi-send"
              class="w-[38px]! min-w-[38px]! bg-blue-600! hover:bg-blue-700! text-white! border-none rounded-full! px-2.5! text-sm font-semibold cursor-pointer! transition-colors duration-300"
              :loading="loadingSendComment"
              :disabled="!commentMessage.trim() || loadingSendComment"
            />
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
