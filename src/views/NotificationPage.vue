<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import notificationApi from "@/services/notificationApi";
import { useToast, useConfirm } from "primevue";
import NotificationItem from "@/components/Notifications/NotificationItem.vue";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// --- STATE ---
const notifications = ref([]);
const unreadCount = ref(0);
const loading = ref(true);

// --- FETCH DATA ---
const loadNotifications = async () => {
  loading.value = true;
  try {
    const response = await notificationApi.getAll();
    notifications.value = response.data.data.notifications;
    unreadCount.value = response.data.data.unread_count;

    authStore.syncNotificationCount(response.data.data.unread_count);
  } catch (error) {
    console.error("Gagal memuat notifikasi", error);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat notifikasi", life: 3000 });
  } finally {
    loading.value = false;
  }
};

// --- COMPUTED GROUPING ---
const groupedNotifications = computed(() => {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.value.forEach((notif) => {
    if (!notif.created_at) return;

    const date = parseISO(notif.created_at);

    if (isToday(date)) {
      groups.today.push(notif);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notif);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notif);
    } else {
      groups.older.push(notif);
    }
  });

  return groups;
});

// --- ACTIONS ---

// 1. Handler ketika notifikasi selesai diproses (misal: diterima/ditolak/dihapus dari dalam item)
const handleNotificationHandled = (id) => {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    // Jika notifikasi yang dihapus statusnya belum dibaca, kurangi counter
    if (!notifications.value[index].is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);

      authStore.decrementNotificationCount();
    }
    // Hapus dari list lokal
    notifications.value.splice(index, 1);
  }
};

// 2. Tandai Semua Dibaca
const handleMarkAllRead = async () => {
  notifications.value.forEach((n) => (n.is_read = true));
  unreadCount.value = 0;

  authStore.resetNotificationCount();

  try {
    await notificationApi.markAllRead();
    toast.add({ severity: "success", summary: "Sukses", detail: "Semua notifikasi ditandai sudah dibaca", life: 3000 });
  } catch (error) {
    console.error("Gagal mark all read", error);
  }
};

onMounted(() => {
  loadNotifications();
});
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <div class="grow flex flex-col items-center justify-center w-full lg:px-4 min-[1920px]:px-0 pt-4 md:pt-0">
      <div class="w-full max-w-7xl pt-4 md:pt-0 md:mt-24 px-4 pb-20">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifikasi
            <span v-if="unreadCount > 0" class="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{{ unreadCount }}</span>
          </h1>
          <button @click="handleMarkAllRead" class="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer transition-colors">Tandai semua dibaca</button>
        </div>

        <!-- LOADING -->
        <div v-if="loading" class="space-y-4">
          <div v-for="n in 5" :key="n" class="animate-pulse flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-white">
            <div class="rounded-xl bg-gray-200 h-12 w-12 shrink-0"></div>
            <div class="flex-1 space-y-2 py-1">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        <!-- KONDISI KOSONG -->
        <div v-else-if="notifications.length === 0" class="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
          <i class="fas fa-bell-slash text-4xl mb-3 text-gray-300"></i>
          <p>Belum ada notifikasi.</p>
        </div>

        <!-- LIST NOTIFIKASI -->
        <div v-else>
          <template v-for="(group, groupName) in groupedNotifications" :key="groupName">
            <div v-if="group.length > 0" class="mb-8 animate-fade-in">
              <h4 class="text-lg font-bold text-gray-800 mb-3 px-1 capitalize">
                {{ groupName === "today" ? "Hari Ini" : groupName === "yesterday" ? "Kemarin" : groupName === "thisWeek" ? "Pekan Ini" : "Lebih Lama" }}
              </h4>

              <div class="space-y-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <!-- Menggunakan Komponen NotificationItem -->
                <NotificationItem v-for="notif in group" :key="notif.id" :notification="notif" @notificationHandled="handleNotificationHandled" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </LayoutDefaultUser>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
