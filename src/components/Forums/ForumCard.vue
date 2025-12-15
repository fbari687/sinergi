<script setup>
import { computed } from "vue";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useRouter } from "vue-router";
import { useToast } from "primevue";

// Menerima prop isMember dari parent
const props = defineProps({
  forum: {
    type: Object,
    required: true,
  },
  communitySlug: {
    type: String,
    required: true,
  },
  isMember: {
    type: Boolean,
    default: true, // Default true agar aman jika dipakai di tempat lain
  },
  isAdminView: { type: Boolean, default: false },
});

const router = useRouter();
const toast = useToast();

const timeAgo = computed(() => {
  return formatDistanceToNow(new Date(props.forum.created_at), { addSuffix: true, locale: idLocale });
});

// Helper untuk membersihkan tag HTML dari deskripsi
const cleanDescription = computed(() => {
  if (!props.forum.description) return "";

  let text = props.forum.description;

  // 1. Ganti entitas HTML &nbsp; dengan spasi biasa
  text = text.replace(/&nbsp;/gi, " ");

  // 2. Hapus semua tag HTML
  text = text.replace(/<[^>]*>/g, "");

  // 3. (PENTING) Ganti karakter Unicode Non-Breaking Space (\u00A0) dengan spasi biasa
  // Masalah copy-paste biasanya selesai di sini
  text = text.replace(/\u00A0/g, " ");

  // 4. Ubah multiple spasi/newline menjadi satu spasi agar rapi
  text = text.replace(/\s+/g, " ");

  return text.trim();
});

// Handle navigasi
const handleClick = () => {
  if (props.isAdminView) {
    router.push(`/admin/communities/${props.communitySlug}/forums/${props.forum.id}`);
    return;
  }
  if (!props.isMember) {
    toast.add({
      severity: "info",
      summary: "Akses Terbatas",
      detail: "Silakan bergabung dengan komunitas untuk melihat detail diskusi.",
      life: 3000,
    });
    return;
  }

  // Jika Member, navigasi ke detail
  router.push(`/communities/${props.communitySlug}/forums/${props.forum.id}`);
};
</script>

<template>
  <div @click="handleClick" class="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row gap-4 relative group">
    <div v-if="!isMember" class="absolute top-2 right-2 text-gray-300 group-hover:text-gray-400 transition">
      <i class="fa-solid fa-lock"></i>
    </div>

    <div class="flex flex-row md:flex-col gap-4 md:gap-2 text-xs md:text-sm md:w-24 shrink-0">
      <div class="flex flex-col items-center p-2 rounded bg-gray-50 border border-gray-100 min-w-[60px]">
        <span class="font-bold text-lg text-gray-700">{{ forum.answer_count || 0 }}</span>
        <span class="text-gray-500 text-xs">Jawaban</span>
      </div>
    </div>

    <div class="flex flex-col gap-1 grow">
      <h3 class="font-bold text-lg text-blue-700 line-clamp-2 group-hover:underline transition">
        {{ forum.title }}
      </h3>

      <p class="text-gray-500 text-sm line-clamp-1">
        {{ cleanDescription }}
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <div class="flex items-center gap-2">
          <img :src="forum.profile_picture_url || 'https://ui-avatars.com/api/?name=' + forum.fullname" class="w-5 h-5 rounded-full object-cover" />
          <span class="font-semibold text-gray-700">{{ forum.fullname }}</span>
        </div>

        <span>•</span>
        <span>{{ timeAgo }}</span>

        <div v-if="forum.media_url" class="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          <i class="fa-regular fa-image"></i>
          <span>Lampiran</span>
        </div>
      </div>
    </div>
  </div>
</template>
