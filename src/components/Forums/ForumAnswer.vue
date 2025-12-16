<script setup>
import { computed, ref, watch } from "vue";
import { useAuthStore } from "@/store/auth";
import { formatIndonesianDate, formatTimeAgo } from "@/utils/formatDate";
import { Image, useConfirm, useToast } from "primevue";
import Menu from "primevue/menu";
import Dialog from "primevue/dialog"; // Import Dialog
import Editor from "primevue/editor"; // Import Editor
import forumApi from "@/services/forumApi";
import NumberFlow from "@number-flow/vue";
import { RouterLink } from "vue-router";
import { useReportModal } from "@/utils/useReportModal";

const { openReport } = useReportModal();

const props = defineProps({
  answer: Object,
  isTopicOwner: Boolean,
  communitySlug: String,
  forumId: [String, Number],
  isAdminView: { type: Boolean, default: false }, // Default false untuk user biasa
});

// Kita ubah emit: tidak lagi emit 'edit'/'delete' untuk aksi,
// tapi emit 'refresh' agar parent tau data berubah.
const emit = defineEmits(["accepted", "refresh"]);

const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const isMe = computed(() => authStore.user?.id === props.answer.user_id);

// --- LOGIKA VOTING (SAMA SEPERTI SEBELUMNYA) ---
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
  const apiPayload = type === "up" ? 1 : -1;

  try {
    let newVoteStatus = 0;
    if (type === "up") {
      if (localUserVote.value === 1) {
        newVoteStatus = 0;
        localVoteCount.value -= 1;
      } else if (localUserVote.value === -1) {
        newVoteStatus = 1;
        localVoteCount.value += 2;
      } else {
        newVoteStatus = 1;
        localVoteCount.value += 1;
      }
    } else if (type === "down") {
      if (localUserVote.value === -1) {
        newVoteStatus = 0;
        localVoteCount.value += 1;
      } else if (localUserVote.value === 1) {
        newVoteStatus = -1;
        localVoteCount.value -= 2;
      } else {
        newVoteStatus = -1;
        localVoteCount.value -= 1;
      }
    }
    localUserVote.value = newVoteStatus;
    await forumApi.voteAnswer(props.answer.id, apiPayload);
  } catch (err) {
    localUserVote.value = previousVote;
    localVoteCount.value = previousCount;
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal melakukan voting", life: 3000 });
  } finally {
    isVoting.value = false;
  }
};

// --- LOGIKA EDIT JAWABAN (PINDAHAN DARI PARENT) ---
const showEditDialog = ref(false);
const isUpdating = ref(false);
const editMessage = ref("");
const editFile = ref(null);
const editFilePreview = ref(null);

const openEditDialog = () => {
  editMessage.value = props.answer.message;
  // Gunakan media_url yang ada sebagai preview awal
  editFilePreview.value = props.answer.media_url;
  editFile.value = null;
  showEditDialog.value = true;
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    editFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      editFilePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeFile = () => {
  editFile.value = null;
  editFilePreview.value = null;
  // Reset input file menggunakan ID unik
  const input = document.getElementById(`edit-media-${props.answer.id}`);
  if (input) input.value = "";
};

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";
  return htmlContent.replace(/&nbsp;/g, " ");
};

const handleUpdate = async () => {
  if (!editMessage.value) return;
  isUpdating.value = true;

  try {
    const formData = new FormData();
    formData.append("message", cleanContent(editMessage.value));

    if (editFile.value) {
      formData.append("media", editFile.value);
    } else if (!editFilePreview.value && !editFile.value) {
      formData.append("delete_media", "true");
    }

    await forumApi.updateRespond(props.answer.id, formData);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Jawaban diperbarui", life: 3000 });
    showEditDialog.value = false;

    // Minta parent refresh data
    emit("refresh");
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal update jawaban", life: 3000 });
  } finally {
    isUpdating.value = false;
  }
};

// --- LOGIKA DELETE (PINDAHAN DARI PARENT) ---
const confirmDelete = () => {
  confirm.require({
    message: "Hapus jawaban ini?",
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
      handleDelete();
    },
  });
};

const handleDelete = async () => {
  try {
    await forumApi.deleteRespond(props.answer.id);
    toast.add({ severity: "success", summary: "Terhapus", detail: "Jawaban dihapus", life: 3000 });
    emit("refresh");
  } catch (e) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus jawaban", life: 3000 });
  }
};

// --- LOGIKA MENU ---
const menu = ref(null);
const toggleMenu = (event) => menu.value.toggle(event);

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

  // LOGIKA ADMIN: Hapus saja
  if (props.isAdminView) {
    items.push({
      label: "Hapus Jawaban (Admin)",
      icon: "fas fa-trash",
      class: "text-red-600 font-bold",
      command: confirmDelete,
    });
    return items; // Admin selesai di sini
  }

  // LOGIKA USER BIASA
  if (isMe.value) {
    items.push({ label: "Edit Jawaban", icon: "fas fa-pen", command: openEditDialog }, { label: "Hapus", icon: "fas fa-trash", class: "text-red-600", command: confirmDelete });
  }
  if (props.isTopicOwner && !props.answer.is_accepted) {
    items.push({ label: "Jadikan Solusi", icon: "fas fa-check", class: "text-green-600", command: handleAccept });
  }
  if (!isMe.value) {
    items.push({ label: "Laporkan", icon: "fas fa-flag", command: () => openReport("FORUM_RESPOND", props.answer?.id) });
  }
  return items;
});

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
  <div class="bg-white border rounded-xl p-5 flex gap-4 transition-all group" :class="answer.is_accepted ? 'border-green-500 shadow-sm bg-green-50/30' : 'border-gray-200'">
    <div class="flex flex-col items-center gap-1 min-w-10">
      <template v-if="!isAdminView">
        <button
          @click="handleVote('up')"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
          :class="localUserVote === 1 ? 'text-blue-600' : 'text-gray-400'"
          :disabled="isVoting"
        >
          <i class="fa-solid fa-caret-up text-3xl transform translate-y-0.5"></i>
        </button>
        <span class="font-bold text-lg text-gray-700 select-none"><NumberFlow :value="localVoteCount" /></span>
        <button
          @click="handleVote('down')"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
          :class="localUserVote === -1 ? 'text-blue-600' : 'text-gray-400'"
          :disabled="isVoting"
        >
          <i class="fa-solid fa-caret-down text-3xl transform -translate-y-0.5"></i>
        </button>
      </template>
      <template v-else>
        <span class="font-bold text-lg text-gray-500 select-none"><NumberFlow :value="localVoteCount" /></span>
        <span class="text-[10px] text-gray-400">Votes</span>
      </template>
      <div v-if="answer.is_accepted" class="mt-3 text-green-600 flex flex-col items-center"><i class="fa-solid fa-check text-2xl"></i></div>
    </div>

    <div class="flex flex-col gap-2 w-full min-w-0">
      <div class="flex justify-between items-start">
        <div class="flex flex-col">
          <div class="flex items-center justify-start gap-1">
            <RouterLink :to="isAdminView ? '' : `/profile/${answer.username}`" class="font-bold text-gray-800 text-sm hover:underline cursor-pointer">{{ answer.fullname }}</RouterLink>
            <span v-if="answer.user_id != authStore.user.id" class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full cursor-default" :class="getRoleColor(answer.role_name)">{{ answer.role_name }}</span>
            <span v-else class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full cursor-default" :class="getRoleColor('default')"> Anda </span>
          </div>
          <p class="text-xs text-gray-500 mt-1 m-0">{{ answer.is_edited ? formatTimeAgo(answer.created_at) + ` (Telah disunting ${formatTimeAgo(answer.updated_at)})` : formatTimeAgo(answer.created_at) }}</p>
        </div>

        <div v-if="menuItems.length > 0">
          <button
            @click="toggleMenu"
            class="text-gray-400 hover:text-gray-600 p-2 rounded-full aspect-square w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition focus:outline-none cursor-pointer"
            aria-haspopup="true"
            :aria-controls="'answer_menu_' + answer.id"
          >
            <i class="fa-solid fa-ellipsis-vertical text-lg"></i>
          </button>
          <Menu ref="menu" :id="'answer_menu_' + answer.id" :model="menuItems" :popup="true">
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

    <Dialog v-model:visible="showEditDialog" modal header="Edit Jawaban" :style="{ width: '800px' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">Isi Jawaban</label>
          <Editor v-model="editMessage" editorStyle="height: 200px">
            <template v-slot:toolbar>
              <span class="ql-formats">
                <button class="ql-bold"></button>
                <button class="ql-italic"></button>
                <button class="ql-underline"></button>
              </span>
            </template>
          </Editor>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm text-gray-700">Lampirkan Gambar (Opsional)</label>
          <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center gap-2">
            <div v-if="!editFilePreview" class="w-full text-center">
              <label :for="`edit-media-${answer.id}`" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
                <span class="text-sm font-medium">Ganti / Upload Gambar</span>
                <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
              </label>
              <input :id="`edit-media-${answer.id}`" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
            </div>
            <div v-else class="relative w-full">
              <img :src="editFilePreview" class="max-h-[200px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />
              <button @click="removeFile" class="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition cursor-pointer">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
              <p v-if="editFile" class="text-center text-xs text-gray-500 mt-2">{{ editFile.name }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button @click="showEditDialog = false" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg cursor-pointer">Batal</button>
        <button @click="handleUpdate" :disabled="isUpdating" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
          <i v-if="isUpdating" class="fa-solid fa-circle-notch fa-spin"></i>
          <span>{{ isUpdating ? "Menyimpan..." : "Simpan Perubahan" }}</span>
        </button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-menu) {
  font-size: 0.875rem;
  min-width: 10rem;
}
</style>
