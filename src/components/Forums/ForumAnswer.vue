<script setup>
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/store/auth";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Image, useToast } from "primevue";
import Menu from "primevue/menu";
import forumApi from "@/services/forumApi";
import NumberFlow from "@number-flow/vue";
import { RouterLink } from "vue-router";

const props = defineProps(["answer", "isTopicOwner", "communitySlug", "forumId"]);

// Emit 'report' ditambahkan di sini
const emit = defineEmits(["accepted", "edit", "delete", "report"]);

const authStore = useAuthStore();
const toast = useToast();

const isMe = computed(() => authStore.user?.id === props.answer.user_id);

// --- LOGIKA VOTING (Optimistic UI) ---
const localVoteCount = ref(props.answer.vote_count || 0);
const localUserVote = ref(props.answer.user_vote || 0);
const isVoting = ref(false);

watch(
  () => props.answer,
  (newVal) => {
    localVoteCount.value = newVal.vote_count || 0;
    localUserVote.value = newVal.user_vote || 0;
  },
  { deep: true }
);

const handleVote = async (type) => {
  if (isVoting.value) return;
  if (isMe.value) {
    toast.add({ severity: "warn", summary: "Info", detail: "Anda tidak bisa vote jawaban sendiri", life: 3000 });
    return;
  }

  const previousVote = localUserVote.value;
  const previousCount = localVoteCount.value;

  isVoting.value = true;

  // Tentukan nilai API (Hanya boleh 1 atau -1)
  // Backend yang akan mengurus logika Toggle (jika kirim 1 padahal sudah 1, maka dihapus)
  const apiPayload = type === "up" ? 1 : -1;

  try {
    // --- LOGIKA UI (Optimistic Update) ---
    // Kita tetap perlu menghitung UI secara manual agar instan
    let newVoteStatus = 0;

    if (type === "up") {
      if (localUserVote.value === 1) {
        // Kasus: Unvote Up
        newVoteStatus = 0;
        localVoteCount.value -= 1;
      } else if (localUserVote.value === -1) {
        // Kasus: Ganti Down ke Up
        newVoteStatus = 1;
        localVoteCount.value += 2;
      } else {
        // Kasus: Upvote Baru
        newVoteStatus = 1;
        localVoteCount.value += 1;
      }
    } else if (type === "down") {
      if (localUserVote.value === -1) {
        // Kasus: Unvote Down
        newVoteStatus = 0;
        localVoteCount.value += 1;
      } else if (localUserVote.value === 1) {
        // Kasus: Ganti Up ke Down
        newVoteStatus = -1;
        localVoteCount.value -= 2;
      } else {
        // Kasus: Downvote Baru
        newVoteStatus = -1;
        localVoteCount.value -= 1;
      }
    }

    // Update UI Lokal
    localUserVote.value = newVoteStatus;

    // --- PANGGIL API ---
    // PENTING: Kita kirim 'apiPayload' (1 atau -1), BUKAN 'newVoteStatus' (0)
    await forumApi.voteAnswer(props.answer.id, apiPayload);
  } catch (err) {
    // Rollback
    console.error(err);
    localUserVote.value = previousVote;
    localVoteCount.value = previousCount;
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal melakukan voting", life: 3000 });
  } finally {
    isVoting.value = false;
  }
};

// --- LOGIKA MENU ---
const menu = ref(null);

const handleAccept = async () => {
  try {
    await forumApi.markAsAccepted(props.communitySlug, props.forumId, props.answer.id);
    toast.add({ severity: "success", summary: "Sukses", detail: "Jawaban ditandai sebagai solusi", life: 3000 });
    emit("accepted");
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal menandai solusi", life: 3000 });
  }
};

const menuItems = computed(() => {
  let items = [];

  // 1. Pemilik Jawaban: Edit & Hapus
  if (isMe.value) {
    items.push({ label: "Edit Jawaban", icon: "fas fa-pen", command: () => emit("edit", props.answer) }, { label: "Hapus", icon: "fas fa-trash", class: "text-red-600", command: () => emit("delete", props.answer.id) });
  }

  // 2. Pemilik Topik: Tandai Solusi
  if (props.isTopicOwner && !props.answer.is_accepted) {
    items.push({ label: "Jadikan Solusi", icon: "fas fa-check", class: "text-green-600", command: handleAccept });
  }

  // 3. Orang Lain: Laporkan
  if (!isMe.value) {
    items.push({
      label: "Laporkan",
      icon: "fas fa-flag",
      command: () => emit("report", props.answer), // Emit ke Parent
    });
  }

  return items;
});

const toggleMenu = (event) => {
  menu.value.toggle(event);
};
</script>

<template>
  <div class="bg-white border rounded-xl p-5 flex gap-4 transition-all group" :class="answer.is_accepted ? 'border-green-500 shadow-sm bg-green-50/30' : 'border-gray-200'">
    <div class="flex flex-col items-center gap-1 min-w-10">
      <button
        v-tooltip.top="{
          value: 'Jawaban ini membantu menyelesaikan masalah',
          pt: {
            text: 'text-xs! text-center!',
          },
        }"
        @click="handleVote('up')"
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
        :class="localUserVote === 1 ? 'text-blue-600' : 'text-gray-400'"
        :disabled="isVoting"
      >
        <i class="fa-solid fa-caret-up text-3xl transform translate-y-0.5"></i>
      </button>

      <span class="font-bold text-lg text-gray-700 select-none"><NumberFlow :value="localVoteCount" /></span>

      <button
        v-tooltip.bottom="{
          value: 'Jawaban ini kurang membantu atau kurang tepat',
          pt: {
            text: 'text-xs! text-center!',
          },
        }"
        @click="handleVote('down')"
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
        :class="localUserVote === -1 ? 'text-blue-600' : 'text-gray-400'"
        :disabled="isVoting"
      >
        <i class="fa-solid fa-caret-down text-3xl transform -translate-y-0.5"></i>
      </button>

      <div v-if="answer.is_accepted" class="mt-3 text-green-600 flex flex-col items-center" title="Jawaban ini ditandai sebagai solusi">
        <i class="fa-solid fa-check text-2xl"></i>
      </div>
    </div>

    <div class="flex flex-col gap-2 w-full min-w-0">
      <div class="flex justify-between items-start">
        <div class="flex flex-col">
          <RouterLink :to="`/profile/${answer.username}`" class="font-bold text-gray-800 text-sm hover:underline cursor-pointer">{{ answer.fullname }}</RouterLink>
          <span class="text-xs text-gray-400">
            {{ formatDistanceToNow(new Date(answer.created_at), { addSuffix: true, locale: idLocale }) }}
          </span>
        </div>

        <div v-if="menuItems.length > 0">
          <button
            @click="toggleMenu"
            class="text-gray-400 hover:text-gray-600 p-2 rounded-full aspect-square w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition focus:outline-none cursor-pointer"
            aria-haspopup="true"
            aria-controls="answer_menu"
          >
            <i class="fa-solid fa-ellipsis-vertical text-lg"></i>
          </button>
          <Menu ref="menu" id="answer_menu" :model="menuItems" :popup="true">
            <template #item="{ item, props }">
              <a v-ripple class="flex items-center" v-bind="props.action">
                <span :class="[item.icon, item.class]" class="mr-2" />
                <span :class="item.class">{{ item.label }}</span>
              </a>
            </template>
          </Menu>
        </div>
      </div>

      <div class="w-full prose prose-sm max-w-full text-gray-800 mt-2 pr-2" v-html="answer.message"></div>

      <div v-if="answer.media_url" class="mt-2 pt-2 border-t border-gray-100">
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block"> Lampiran </span>
        <div class="rounded-lg overflow-hidden border border-gray-200 inline-block bg-gray-50">
          <Image :src="answer.media_url" alt="Lampiran Masalah" preview imageClass="max-h-[100px] object-contain" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-menu) {
  font-size: 0.875rem;
  min-width: 10rem;
}
</style>
