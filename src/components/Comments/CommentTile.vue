<script setup>
import { useAuthStore } from "@/store/auth";
import { formatTimeAgo } from "@/utils/formatDate";
import { Popover, useConfirm } from "primevue";
import { ref, computed, watch, inject } from "vue";
import commentApi from "@/services/commentApi"; // Import API
import { useReportModal } from "@/utils/useReportModal";
import { RouterLink } from "vue-router";

const { openReport } = useReportModal();

defineOptions({
  name: "CommentTile",
});

const opPopover = ref(null);
const authStore = useAuthStore();
const confirm = useConfirm();

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  isAdminView: { type: Boolean, default: false },
});

const emit = defineEmits(["deleteComment", "setReply"]);

// --- STATE UNTUK BALASAN ---
const replies = ref([]);
const areRepliesLoaded = ref(false); // Penanda apakah data sudah diambil dari API
const showReplies = ref(false); // Penanda apakah section balasan terbuka
const loadingReplies = ref(false); // Loading state
const visibleCount = ref(5); // Limit awal 5

// Mengambil jumlah balasan dari backend (reply_count)
const replyCount = computed(() => props.comment.reply_count || 0);

// Data balasan yang ditampilkan (dipotong sesuai visibleCount)
const visibleReplies = computed(() => {
  return replies.value.slice(0, visibleCount.value);
});

// Cek apakah masih ada balasan yang tersembunyi
const hasMoreReplies = computed(() => {
  return visibleCount.value < replies.value.length;
});

// --- METHODS ---

const togglePopover = (event) => {
  opPopover.value.toggle(event);
};

const confirmDelete = () => {
  confirm.require({
    message: "Hapus komentar ini?",
    header: "Konfirmasi",
    icon: "pi pi-info-circle",
    rejectLabel: "Batal",
    rejectProps: {
      label: "Batal",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Hapus",
      severity: "danger",
    },
    accept: () => {
      emit("deleteComment", props.comment.id);
    },
  });
};

const forwardDelete = (id) => {
  emit("deleteComment", id);
};

const forwardReply = (payload) => {
  emit("setReply", payload);
};

const handleReplyClick = () => {
  emit("setReply", {
    comment: props.comment,
    username: props.comment.user.username,
  });
};

const refreshSignal = inject("refreshSignal", ref(null));

// --- LOGIKA FETCH BALASAN ---

const fetchReplies = async () => {
  loadingReplies.value = true;
  try {
    const response = await commentApi.getReplies(props.comment.id);
    replies.value = response.data.data;
    areRepliesLoaded.value = true;
    showReplies.value = true; // Otomatis buka jika sukses load
  } catch (err) {
    console.error("Gagal memuat balasan:", err);
  } finally {
    loadingReplies.value = false;
  }
};

const toggleReplies = async () => {
  // Jika sudah pernah load, tinggal toggle visibility
  if (areRepliesLoaded.value) {
    showReplies.value = !showReplies.value;
    return;
  }

  // Jika belum, fetch dari API
  await fetchReplies();
  // loadingReplies.value = true;
  // try {
  //   const response = await commentApi.getReplies(props.comment.id);
  //   replies.value = response.data.data;
  //   areRepliesLoaded.value = true;
  //   showReplies.value = true;
  // } catch (err) {
  //   console.error("Gagal memuat balasan:", err);
  // } finally {
  //   loadingReplies.value = false;
  // }
};

// 1. Watch Signal: Jika ID saya dipanggil lewat signal, refresh balasan saya!
watch(refreshSignal, (signal) => {
  if (signal && signal.commentId === props.comment.id) {
    // Force refresh walaupun sedang tertutup
    fetchReplies();
  }
});

// 2. Watch Props: Jika reply_count berubah dari luar (misal real-time atau loadComments parent)
watch(
  () => props.comment.reply_count,
  (newCount, oldCount) => {
    // Jika jumlah bertambah
    if (newCount > oldCount) {
      areRepliesLoaded.value = false; // Tandai data lama basi

      // Jika sedang terbuka, atau ini balasan pertama (0->1), refresh otomatis
      if (showReplies.value || oldCount === 0) {
        fetchReplies();
      }
    }
  }
);

// watch(
//   () => props.comment.reply_count,
//   (newCount, oldCount) => {
//     // Jika panel sedang terbuka, atau data sudah pernah diload
//     // Kita paksa fetch ulang agar balasan baru milik user langsung muncul
//     if (newCount > oldCount && (showReplies.value || areRepliesLoaded.value)) {
//       fetchReplies();
//     }
//   }
// );

const loadMoreReplies = () => {
  visibleCount.value += 5; // Tambah 5 setiap kali klik
};
</script>

<template>
  <div class="flex flex-col">
    <!-- TAMPILAN UTAMA KOMENTAR -->
    <div class="flex items-start gap-3">
      <RouterLink :to="isAdminView ? '' : `/profile/${comment.user.username}`">
        <img :src="comment.user.profile_picture" alt="User" class="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover self-start mt-1" />
      </RouterLink>

      <div class="flex-1">
        <!-- Bubble Komentar -->
        <div class="bg-gray-100 rounded-2xl px-4 py-2 inline-block min-w-[200px]">
          <div class="flex justify-between items-baseline gap-4 mb-1">
            <RouterLink :to="isAdminView ? '' : `/profile/${comment.user.username}`" class="text-sm font-bold text-gray-900 hover:underline cursor-pointer">{{ comment.user.username }}</RouterLink>
            <span class="text-xs text-gray-500">
              {{ formatTimeAgo(comment.created_at) }}
            </span>
          </div>
          <p class="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{{ comment.content }}</p>
        </div>

        <!-- Action Buttons & Toggle Reply Button -->
        <div class="flex items-center flex-wrap gap-4 mt-1 ml-2 select-none">
          <button type="button" @click="handleReplyClick" class="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">Balas</button>

          <!-- Tombol Lihat Balasan (Hanya muncul jika ada reply_count > 0) -->
          <button v-if="replyCount > 0" type="button" @click="toggleReplies" class="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors flex items-center gap-1">
            <span v-if="loadingReplies"><i class="fas fa-circle-notch fa-spin"></i> Loading...</span>
            <span v-else>
              {{ showReplies ? "Sembunyikan balasan" : `Lihat ${replyCount} balasan` }}
            </span>
          </button>

          <button type="button" @click="togglePopover($event)" class="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">Lainnya</button>
        </div>
      </div>

      <!-- Popover Menu -->
      <div class="">
        <Popover ref="opPopover" class="bg-transparent border-none shadow-none p-0 z-10">
          <template v-if="comment.user.id == authStore.user.id || isAdminView">
            <button type="button" @click="confirmDelete()" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50"><i class="fas fa-trash w-4 text-center"></i> Hapus</button>
          </template>
          <template v-else>
            <button type="button" @click="openReport('COMMENT', comment.id)" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50">
              <i class="fas fa-flag w-4 text-center"></i> Laporkan
            </button>
          </template>
        </Popover>
      </div>
    </div>

    <!-- LIST BALASAN (RECURSIVE) -->
    <!-- Logika indentasi: Hanya level 0 (root) yang memberikan margin-left untuk anaknya. 
         Level 1 ke atas (depth >= 1) tidak menambah margin lagi (flat). -->
    <div v-if="showReplies" class="flex flex-col gap-3 mt-3 transition-all duration-300" :class="depth === 0 ? 'ml-11 md:ml-14' : ''">
      <!-- Loop Balasan yang Terlihat -->
      <CommentTile v-for="reply in visibleReplies" :key="reply.id" :comment="reply" :isAdminView="isAdminView" :depth="depth + 1" @deleteComment="forwardDelete" @setReply="forwardReply" />

      <!-- Tombol "Lihat balasan lainnya" -->
      <button v-if="hasMoreReplies" @click="loadMoreReplies" class="text-xs font-bold text-gray-500 hover:text-blue-600 self-start mt-1 cursor-pointer flex items-center gap-2">
        <i class="fas fa-share fa-flip-vertical"></i> Lihat balasan lainnya ({{ replies.length - visibleCount }} lagi)
      </button>
    </div>
  </div>
</template>
