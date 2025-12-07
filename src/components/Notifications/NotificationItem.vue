<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useToast, useConfirm } from "primevue"; // Tambahkan useConfirm
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import communityApi from "@/services/communityApi";
import notificationApi from "@/services/notificationApi";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["notificationHandled", "close"]);

const router = useRouter();
const toast = useToast();
const confirm = useConfirm(); // Init confirm
const processing = ref(false);

// Format Waktu (Contoh: "5 menit yang lalu")
const timeAgo = computed(() => {
  return formatDistanceToNow(new Date(props.notification.created_at), { addSuffix: true, locale: id });
});

// Cek apakah ini undangan komunitas
const isInvite = computed(() => {
  return props.notification.type === "COMMUNITY_INVITE";
});

const getSlugFromLink = (link) => {
  if (!link) return null;
  const parts = link.split("/");
  return parts[parts.length - 1];
};

// --- ACTIONS ---

const handleClick = async () => {
  if (props.notification.link) {
    if (!props.notification.is_read) {
      await notificationApi.markAsRead(props.notification.id);
    }
    router.push(props.notification.link);
    emit("close");
  }
};

// Helper Hapus Notifikasi (API Call)
const deleteNotification = async () => {
  try {
    await notificationApi.delete(props.notification.id);
    // Emit event agar parent menghapus item ini dari list lokal
    emit("notificationHandled", props.notification.id);
  } catch (e) {
    console.error("Gagal menghapus notifikasi", e);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus notifikasi", life: 3000 });
  }
};

// Handler Klik Tombol Hapus (dengan Konfirmasi)
const onDeleteClick = (event) => {
  event.stopPropagation(); // Jangan trigger navigasi
  confirm.require({
    message: "Hapus notifikasi ini?",
    header: "Konfirmasi",
    icon: "pi pi-info-circle",
    rejectLabel: "Batal",
    acceptLabel: "Hapus",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => await deleteNotification(),
  });
};

const onAccept = async (event) => {
  event.stopPropagation();
  const slug = getSlugFromLink(props.notification.link);
  if (!slug) return;

  processing.value = true;
  try {
    await communityApi.acceptInvitation(slug);
    toast.add({ severity: "success", summary: "Bergabung", detail: "Anda berhasil bergabung!", life: 3000 });

    // Hapus notifikasi agar tidak muncul lagi
    await deleteNotification();

    // [BARU] Redirect langsung ke halaman komunitas
    // Kita gunakan link dari notifikasi, atau fallback ke manual slug
    if (props.notification.link) {
      router.push(props.notification.link);
    } else {
      router.push(`/communities/${slug}`);
    }

    // Tutup dropdown notifikasi jika ada (opsional, tergantung implementasi parent)
    emit("close");
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memproses permintaan.", life: 3000 });
  } finally {
    processing.value = false;
  }
};

const onDecline = async (event) => {
  event.stopPropagation();
  const slug = getSlugFromLink(props.notification.link);
  if (!slug) return;

  processing.value = true;
  try {
    await communityApi.declineInvitation(slug);
    toast.add({ severity: "info", summary: "Ditolak", detail: "Undangan ditolak.", life: 3000 });
    await deleteNotification();
  } catch (err) {
    console.error(err);
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memproses permintaan.", life: 3000 });
  } finally {
    processing.value = false;
  }
};
</script>

<template>
  <div class="flex gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer relative group" :class="{ 'bg-blue-50/50': !notification.is_read }" @click="handleClick">
    <!-- Ikon Berdasarkan Tipe -->
    <div class="shrink-0 mt-1">
      <div v-if="isInvite" class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
        <i class="fa-solid fa-envelope-open-text"></i>
      </div>
      <div v-else-if="notification.type === 'COMMUNITY_KICK'" class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <i class="fa-solid fa-ban"></i>
      </div>
      <div v-else class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
        <i class="fa-solid fa-bell"></i>
      </div>
    </div>

    <div class="flex-1 pr-6">
      <!-- Pesan -->
      <p class="text-sm text-gray-800 leading-snug" v-html="notification.message"></p>
      <span class="text-xs text-gray-500 mt-1 block">{{ timeAgo }}</span>

      <!-- AREA TOMBOL KHUSUS UNDANGAN -->
      <div v-if="isInvite" class="flex gap-2 mt-3">
        <button @click="onAccept" :disabled="processing" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1">
          <i v-if="processing" class="fa-solid fa-circle-notch fa-spin"></i>
          <span v-else>Terima</span>
        </button>

        <button @click="onDecline" :disabled="processing" class="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-md hover:bg-gray-300 transition disabled:opacity-50">Tolak</button>
      </div>
    </div>

    <!-- Indikator Belum Dibaca -->
    <div v-if="!notification.is_read" class="absolute right-3 top-3 w-2 h-2 bg-blue-600 rounded-full"></div>

    <!-- [BARU] Tombol Hapus (Hover) -->
    <button
      @click="onDeleteClick"
      class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10 bg-white/80 backdrop-blur-sm shadow-sm"
      title="Hapus notifikasi"
    >
      <i class="fa-solid fa-trash text-xs"></i>
    </button>
  </div>
</template>
