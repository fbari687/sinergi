<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import PostDetailContent from "@/components/Posts/PostDetailContent.vue";
import postApi from "@/services/postApi";
import PostDetailSkeleton from "@/components/Posts/PostDetailSkeleton.vue";

const route = useRoute();
const router = useRouter();
const postId = route.params.id;

const post = ref(null);
const loading = ref(true);

const loadPost = async () => {
  loading.value = true;

  try {
    const response = await postApi.getPostById(postId);
    post.value = response.data.data;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        router.replace({ name: "ForbiddenPage" });
      } else if (status === 404) {
        router.replace({ name: "HomePage" });
      }
    }
    console.error("Gagal memuat post", err);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

const handleLike = (postId) => {
  if (post.value && post.value.id === postId) {
    post.value.is_liked_by_user = !post.value.is_liked_by_user;
    post.value.like_count += post.value.is_liked_by_user ? 1 : -1;
  }
};
const handleChangeCommentCount = (postId, count) => {
  if (post.value && post.value.id === postId) {
    post.value.comment_count = count;
  }
};
const handleDeletePost = async (postId) => {
  try {
    await postApi.deletePost(postId);

    router.push("/");
  } catch (err) {
    console.error("Gagal menghapus post: ", err);
  }
};

onMounted(loadPost);
</script>

<template>
  <LayoutDefaultUser :useNavbar="false" :useSidebar="false" :useRightSidebar="false">
    <header class="fixed top-0 left-0 w-full z-40 flex items-center bg-white py-3 px-6 border-b border-gray-200 shadow-sm">
      <button @click="goBack" type="button" class="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold p-2 rounded-lg transition-colors cursor-pointer duration-200 hover:bg-gray-100">
        <i class="fas fa-arrow-left"></i>
      </button>
    </header>
    <main class="w-full max-w-[690px] self-start lg:mt-16">
      <template v-if="loading">
        <PostDetailSkeleton />
      </template>

      <template v-else-if="post">
        <PostDetailContent :post="post" @changeCommentCount="handleChangeCommentCount" @toggleLike="handleLike" @handleDelete="handleDeletePost" class="h-full" />
      </template>

      <template v-else>
        <p class="p-4">Postingan tidak ditemukan.</p>
      </template>
    </main>
  </LayoutDefaultUser>
</template>
