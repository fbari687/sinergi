<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useToast } from "primevue";
import forumApi from "@/services/forumApi";

const props = defineProps(["answer", "isTopicOwner", "communitySlug", "forumId"]);
const emit = defineEmits(["accepted"]);
const authStore = useAuthStore();
const toast = useToast();

const isMe = computed(() => authStore.user?.id === props.answer.user_id);

const handleAccept = async () => {
  try {
    await forumApi.markAsAccepted(props.communitySlug, props.forumId, props.answer.id);
    toast.add({ severity: "success", summary: "Sukses", detail: "Jawaban ditandai sebagai solusi", life: 3000 });
    emit("accepted");
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal menandai solusi", life: 3000 });
  }
};
</script>

<template>
  <div class="bg-white border rounded-xl p-5 flex gap-4 transition-all" :class="answer.is_accepted ? 'border-green-500 shadow-sm bg-green-50/30' : 'border-gray-200'">
    <div class="flex flex-col items-center gap-2">
      <img :src="answer.profile_picture_url || 'https://ui-avatars.com/api/?name=' + answer.fullname" class="w-10 h-10 rounded-full bg-gray-100" />

      <div v-if="answer.is_accepted" class="mt-2 text-green-600 flex flex-col items-center">
        <i class="fa-solid fa-check text-2xl"></i>
        <span class="text-[10px] font-bold uppercase">Solusi</span>
      </div>
    </div>

    <div class="flex flex-col gap-2 w-full">
      <div class="flex justify-between items-start">
        <div class="flex flex-col">
          <span class="font-bold text-gray-800 text-sm">{{ answer.fullname }}</span>
          <span class="text-xs text-gray-400">
            {{ formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: idLocale }) }}
          </span>
        </div>

        <button
          v-if="isTopicOwner && !answer.is_accepted"
          @click="handleAccept"
          class="text-xs border border-green-600 text-green-600 px-3 py-1 rounded hover:bg-green-600 hover:text-white transition"
          title="Tandai jawaban ini sebagai solusi terbaik"
        >
          <i class="fa-solid fa-check"></i> Jadikan Solusi
        </button>
      </div>

      <div class="w-full prose prose-sm max-w-full text-gray-800 mt-2 pr-2" v-html="answer.message"></div>
    </div>
  </div>
</template>
