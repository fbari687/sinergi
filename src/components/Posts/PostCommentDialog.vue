<script setup>
import { Dialog } from "primevue";
import PostDetailContent from "./PostDetailContent.vue";

const props = defineProps({
  // Properti untuk data postingan
  post: {
    type: Object,
    required: true,
  },
  // Properti v-model untuk mengontrol tampilan dialog
  visible: {
    type: Boolean,
    required: true,
  },
  isAdminView: { type: Boolean, default: false },
});

const emit = defineEmits(["update:visible", "changeCommentCount", "toggleLike", "deletePost"]);

const handleChangeCommentCount = (postId, count) => {
  emit("changeCommentCount", postId, count);
};

// Memicu aksi like/unlike di PostCard
const handleLike = (postId) => {
  emit("toggleLike", postId);
};

const handleDeletePost = (postId) => {
  emit("deletePost", postId);
};
</script>

<template>
  <Dialog
    :visible="props.visible"
    @update:visible="(value) => emit('update:visible', value)"
    modal
    :header="'Postingan ' + post.user.fullname"
    class="relative"
    :style="{ width: '700px', height: '850px' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :draggable="false"
  >
    <PostDetailContent :post="post" :isAdminView="props.isAdminView" @changeCommentCount="handleChangeCommentCount" @toggleLike="handleLike" @handleDelete="handleDeletePost" />
  </Dialog>
</template>

<style scoped></style>
