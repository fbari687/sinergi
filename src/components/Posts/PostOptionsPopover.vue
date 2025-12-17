<script setup>
import { useAuthStore } from "@/store/auth";
import { Button, Popover, useConfirm, useToast } from "primevue";
import { ref } from "vue";
import EditPost from "@/components/Posts/EditPost.vue";
import { useReportModal } from "@/utils/useReportModal";
import postApi from "@/services/postApi";

const { openReport } = useReportModal();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
  // PROP BARU
  isAdminView: {
    type: Boolean,
    default: false,
  },
});
const authStore = useAuthStore();
const emit = defineEmits(["deletePost", "postUpdated"]);

const opPopover = ref(null);
const confirm = useConfirm();
const toast = useToast();
const showEditDialog = ref(false);
const pinLoading = ref(false);

const togglePopover = (event) => {
  opPopover.value.toggle(event);
};

const handleTogglePin = async () => {
  pinLoading.value = true;
  try {
    const res = await postApi.togglePostPin(props.post.id);
    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: res.data.meta.message,
      life: 3000,
    });

    emit("postUpdated"); // Refresh data agar posisi postingan pindah ke atas
    if (opPopover.value) opPopover.value.hide();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Gagal mengubah status sematan",
      life: 3000,
    });
  } finally {
    pinLoading.value = false;
  }
};

const handleEditClick = () => {
  showEditDialog.value = true;
  if (opPopover.value) opPopover.value.hide();
};

const handlePostUpdated = () => {
  emit("postUpdated");
};

const confirmDelete = () => {
  confirm.require({
    message: props.isAdminView ? `Hapus postingan dari ${props.post.user.username}? Tindakan admin tidak dapat dibatalkan.` : "Do you want to delete this post?",
    header: props.isAdminView ? "Moderasi Admin" : "Danger Zone",
    icon: "pi pi-info-circle",
    rejectLabel: "Cancel",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: () => {
      emit("deletePost", props.post.id);
      toast.add({ severity: "info", summary: "Confirmed", detail: "Post deleted", life: 3000 });
    },
  });
};
</script>

<template>
  <div class="relative">
    <Button type="button" @click="togglePopover($event)" class="bg-transparent! border-none! text-base text-gray-600! cursor-pointer p-1.5 rounded-full hover:bg-gray-100">
      <i class="fas fa-ellipsis-h"></i>
    </Button>
    <Popover ref="opPopover" class="bg-transparent border-none shadow-none p-0 z-30">
      <template v-if="authStore.user?.role === 'Admin'">
        <button type="button" @click="handleTogglePin" :disabled="pinLoading" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 border-b border-gray-50">
          <i class="fas fa-thumbtack w-5 text-center" :class="post.is_pinned ? 'text-blue-500' : 'text-gray-500'"></i>
          <span :class="{ 'font-bold text-blue-600': post.is_pinned }">
            {{ post.is_pinned ? "Lepas Sematan" : "Sematkan Postingan" }}
          </span>
        </button>
      </template>

      <template v-if="post.user.id == authStore.user.id">
        <button type="button" @click="handleEditClick" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"><i class="fas fa-edit w-5 text-center text-gray-500"></i> Edit</button>
        <button type="button" @click="confirmDelete()" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"><i class="fas fa-trash w-5 text-center text-gray-500"></i> Delete</button>
      </template>

      <template v-else-if="isAdminView">
        <button type="button" @click="confirmDelete()" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold"><i class="fas fa-trash-can w-5 text-center"></i> Hapus (Admin)</button>
      </template>

      <template v-else>
        <button type="button" @click="openReport('POST', post.id)" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100">
          <i class="fas fa-flag w-5 text-center text-gray-500"></i> Laporkan
        </button>
      </template>
    </Popover>

    <EditPost v-model:visible="showEditDialog" :post="post" @postUpdated="handlePostUpdated" />
  </div>
</template>
