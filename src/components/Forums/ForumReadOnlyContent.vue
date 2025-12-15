<script setup>
import { computed } from "vue";
import Image from "primevue/image";

const props = defineProps({
  forum: {
    type: Object,
    required: true,
  },
});

// Helper untuk format tanggal (bisa disesuaikan)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  <div class="flex flex-col gap-6 p-4">
    <div class="flex flex-col gap-3 border-b border-gray-200 pb-4">
      <h1 class="text-2xl font-extrabold text-gray-900 leading-tight">
        {{ forum.title }}
      </h1>

      <div class="flex items-center gap-2 text-sm text-gray-500">
        <span class="text-gray-400">Ditanya oleh</span>

        <img :src="forum.user?.profile_picture_url || forum.profile_picture_url || 'https://ui-avatars.com/api/?name=' + (forum.user?.fullname || forum.fullname)" class="w-6 h-6 rounded-full object-cover border border-gray-200" />

        <span class="font-bold text-gray-800">
          {{ forum.user?.fullname || forum.fullname }}
        </span>

        <span class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full cursor-default" :class="getRoleColor(forum.user?.role?.name || forum.role_name)">
          {{ forum.user?.role?.name || forum.role_name }}
        </span>

        <span>•</span>
        <span>{{ formatDate(forum.created_at) }}</span>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div class="prose prose-sm prose-blue w-full max-w-none text-gray-800" v-html="forum.description"></div>

      <div v-if="forum.media_url" class="mt-2 pt-4 border-t border-gray-100">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block"> Lampiran </span>
        <div class="rounded-lg overflow-hidden border border-gray-200 inline-block bg-gray-50">
          <Image :src="forum.media_url" alt="Lampiran Forum" preview imageClass="max-h-[300px] w-auto object-contain" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Pastikan styling prose/typography tersedia (Tailwind Typography Plugin) */
</style>
