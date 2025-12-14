<script setup>
import { formatTimeAgo, formatIndonesianDate } from "@/utils/formatDate";
import Image from "primevue/image";
import { RouterLink } from "vue-router";
import NumberFlow from "@number-flow/vue";
import { onMounted } from "vue";

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});

// Helper untuk warna role (copy paste agar konsisten)
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
  <div class="flex flex-col h-full bg-white relative">
    <div class="flex-1 p-0 space-y-4 overflow-y-auto">
      <div class="flex items-start">
        <RouterLink :to="`/profile/${post.user.username}`" target="_blank">
          <img :src="post.user.profile_picture" alt="Profile" class="w-12 h-12 rounded-full mr-3 object-cover border border-gray-100" />
        </RouterLink>

        <div class="grow">
          <RouterLink :to="`/profile/${post.user.username}`" target="_blank" class="flex items-center w-fit gap-1 text-base text-black font-bold m-0 hover:underline">
            <span>{{ post.user.username }}</span>
            <span class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full" :class="getRoleColor(post.user.role)">
              {{ post.user.role }}
            </span>
          </RouterLink>
          <p class="text-xs text-gray-500 mt-1 m-0">
            {{ post.is_edited ? formatIndonesianDate(post.created_at) + ` (Disunting)` : formatIndonesianDate(post.created_at) }}
          </p>
        </div>
      </div>

      <div class="text-sm leading-relaxed text-gray-800">
        <p class="w-full whitespace-pre-wrap" v-html="post.description"></p>

        <template v-if="post.media_url != null">
          <div class="w-full mt-3 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-50">
            <Image :src="post.media_url" alt="Gambar Postingan" preview imageClass="max-w-full h-auto max-h-[500px] object-contain" />
          </div>
        </template>
      </div>

      <div class="flex items-center gap-6 pt-4 border-t border-gray-100 text-gray-500 text-sm">
        <div class="flex items-center gap-2" title="Jumlah Like">
          <i class="fa-solid fa-heart text-pink-600"></i>
          <span class="font-semibold"><NumberFlow :value="post.like_count || 0" /> Suka</span>
        </div>

        <div class="flex items-center gap-2" title="Jumlah Komentar">
          <i class="fa-solid fa-comment text-blue-600"></i>
          <span class="font-semibold"><NumberFlow :value="post.comment_count || 0" /> Komentar</span>
        </div>

        <div class="flex-1 text-right text-xs text-gray-400">ID Post: {{ post.id }}</div>
      </div>
    </div>
  </div>
</template>
