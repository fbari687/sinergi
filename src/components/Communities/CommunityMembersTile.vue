<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { Popover, useToast, useConfirm } from "primevue";
import memberApi from "@/services/memberApi";
import communityApi from "@/services/communityApi";

const props = defineProps({
  member: { type: Object, required: true },
  currentUserRole: { type: String, required: true }, // Role user yang login (OWNER/ADMIN/MEMBER)
  communitySlug: { type: String, required: true },
  isAdminView: { type: Boolean, default: false },
});

const emit = defineEmits(["refresh"]); // Event untuk minta parent refresh data

const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();
const op = ref();

// Toggle Popover
const togglePopover = (event) => {
  op.value.toggle(event);
};

// --- LOGIKA HAK AKSES (PERMISSION) ---
const isMe = computed(() => authStore.user?.id === props.member.id);

const canTransferOwnership = computed(() => {
  // Syarat: Saya harus OWNER, dan target BUKAN saya
  return props.currentUserRole === "OWNER" && !isMe.value;
});

const handleTransferOwnership = () => {
  op.value.hide();

  confirm.require({
    message: `PERINGATAN: Anda akan menyerahkan hak kepemilikan grup kepada ${props.member.fullname}. Status Anda akan berubah menjadi ADMIN. Lanjutkan?`,
    header: "Transfer Kepemilikan",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      try {
        await communityApi.transferOwnership(props.communitySlug, props.member.id);
        toast.add({ severity: "success", summary: "Sukses", detail: "Kepemilikan telah dipindahkan.", life: 3000 });

        // Refresh penuh karena role saya berubah drastis (Owner -> Admin)
        window.location.reload();
      } catch (err) {
        toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal memproses transfer.", life: 3000 });
      }
    },
  });
};

// Can Kick?
const canKick = computed(() => {
  if (isMe.value) return false;
  const myRole = props.currentUserRole;
  const targetRole = props.member.role;

  // Owner Dewa, Admin cuma bisa kick Member biasa
  if (myRole === "OWNER") return true;
  if (myRole === "ADMIN") return targetRole === "MEMBER";
  return false;
});

// Can Promote to Admin? (Hanya Owner ke Member)
const canPromote = computed(() => {
  return props.currentUserRole === "OWNER" && props.member.role === "MEMBER" && !isMe.value;
});

// Can Demote to Member? (Hanya Owner ke Admin)
const canDemote = computed(() => {
  return props.currentUserRole === "OWNER" && props.member.role === "ADMIN" && !isMe.value;
});

// --- ACTIONS ---
const handleKick = () => {
  op.value.hide();
  confirm.require({
    message: `Yakin ingin mengeluarkan ${props.member.fullname}?`,
    header: "Konfirmasi Kick",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Batal",
    acceptLabel: "Keluarkan",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      try {
        await memberApi.kickMember(props.communitySlug, props.member.id);
        toast.add({ severity: "success", summary: "Sukses", detail: "Anggota dikeluarkan", life: 3000 });
        emit("refresh"); // Refresh list
      } catch (err) {
        toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengeluarkan anggota", life: 3000 });
      }
    },
  });
};

const handleChangeRole = async (newRole) => {
  op.value.hide();
  try {
    await memberApi.changeRole(props.communitySlug, props.member.id, newRole);
    toast.add({ severity: "success", summary: "Sukses", detail: `Role diubah ke ${newRole}`, life: 3000 });
    emit("refresh");
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengubah role", life: 3000 });
  }
};

// Helpers UI
const roleLabel = computed(() => {
  if (props.member.role === "OWNER") return "Admin Grup";
  if (props.member.role === "ADMIN") return "Admin";
  return "Anggota";
});

const joinDate = computed(() => {
  if (!props.member.created_at) return "-";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(props.member.created_at));
});
</script>

<template>
  <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div class="flex items-center gap-3">
      <img :src="member.profile_picture || `https://ui-avatars.com/api/?name=${member.fullname}&background=random`" class="w-10 h-10 rounded-full object-cover bg-gray-100" />
      <div class="flex flex-col">
        <RouterLink :to="isAdminView ? '' : `/profile/${member.username}`" class="font-semibold text-gray-900 text-sm hover:underline">{{ member.fullname }}</RouterLink>
        <div class="flex items-center gap-2 text-xs">
          <template v-if="member.role === 'OWNER' || member.role === 'ADMIN'">
            <span class="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-100">
              {{ roleLabel }}
            </span>
            <span v-if="member.role === 'OWNER'" class="text-gray-500">• Pemilik</span>
          </template>
          <template v-else>
            <span class="text-gray-500">Bergabung {{ joinDate }}</span>
          </template>
        </div>
      </div>
    </div>

    <div v-if="!isMe && (canKick || canPromote || canDemote)">
      <button @click="togglePopover" class="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full hover:bg-gray-100 transition">
        <i class="fa-solid fa-ellipsis"></i>
      </button>

      <Popover ref="op" class="w-48">
        <div class="flex flex-col py-1">
          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex gap-2 items-center"><i class="fa-regular fa-user w-4"></i> Lihat Profil</button>

          <button v-if="canPromote" @click="handleChangeRole('ADMIN')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex gap-2 items-center"><i class="fa-solid fa-shield-halved w-4"></i> Jadikan Admin</button>

          <button v-if="canDemote" @click="handleChangeRole('MEMBER')" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex gap-2 items-center"><i class="fa-solid fa-user-shield w-4"></i> Hapus Admin</button>

          <button v-if="canTransferOwnership" @click="handleTransferOwnership" class="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-b border-gray-100">
            <i class="fa-solid fa-crown w-4 text-center"></i>
            <span>Jadikan Owner Utama</span>
          </button>

          <div v-if="canKick" class="h-px bg-gray-200 my-1"></div>

          <button v-if="canKick" @click="handleKick" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex gap-2 items-center"><i class="fa-solid fa-user-minus w-4"></i> Hapus Anggota</button>
        </div>
      </Popover>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-popover) {
  border-radius: 0.75rem;
  padding: 0;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
:deep(.p-popover-content) {
  padding: 0 !important;
}
</style>
