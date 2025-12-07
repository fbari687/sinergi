<script setup>
import { ref, onMounted } from "vue";
import memberApi from "@/services/memberApi";
import { useToast } from "primevue";

const props = defineProps(["communitySlug"]);
const emit = defineEmits(["requestHandled"]); // Memberitahu parent jika ada yang di-approve (tambah member count)

const requests = ref([]);
const loading = ref(false);
const toast = useToast();

const loadRequests = async () => {
  loading.value = true;
  try {
    const res = await memberApi.getJoinRequests(props.communitySlug);
    requests.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleApprove = async (userId) => {
  try {
    await memberApi.approveRequest(props.communitySlug, userId);
    toast.add({ severity: "success", summary: "Disetujui", detail: "Anggota baru ditambahkan", life: 3000 });
    // Hapus dari list lokal
    requests.value = requests.value.filter((r) => r.id !== userId);
    emit("requestHandled"); // Refresh list member utama
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menyetujui", life: 3000 });
  }
};

const handleDecline = async (userId) => {
  try {
    await memberApi.declineRequest(props.communitySlug, userId);
    toast.add({ severity: "info", summary: "Ditolak", detail: "Permintaan dihapus", life: 3000 });
    requests.value = requests.value.filter((r) => r.id !== userId);
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menolak", life: 3000 });
  }
};

onMounted(loadRequests);
</script>

<template>
  <div class="bg-white border border-gray-200 rounded-xl p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-gray-900">Permintaan Bergabung</h3>
      <span v-if="requests.length > 0" class="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
        {{ requests.length }}
      </span>
    </div>

    <div v-if="loading" class="flex justify-center py-4">
      <i class="fa-solid fa-circle-notch fa-spin text-gray-400"></i>
    </div>

    <div v-else-if="requests.length === 0" class="text-gray-500 text-sm text-center py-4">Tidak ada permintaan baru.</div>

    <div v-else class="flex flex-col gap-4">
      <div v-for="req in requests" :key="req.id" class="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
        <div class="flex items-center gap-2">
          <img :src="req.profile_picture || 'https://ui-avatars.com/api/?name=' + req.fullname" class="w-8 h-8 rounded-full bg-gray-100 object-cover" />
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-800 line-clamp-1">{{ req.fullname }}</span>
            <span class="text-xs text-gray-400">@{{ req.username }}</span>
          </div>
        </div>

        <div class="flex gap-2 mt-1">
          <button @click="handleApprove(req.id)" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 rounded transition">Terima</button>
          <button @click="handleDecline(req.id)" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 rounded transition">Tolak</button>
        </div>
      </div>
    </div>
  </div>
</template>
