<script setup>
import { useAuthStore } from "@/store/auth";
import { Button, Popover, useConfirm, useToast } from "primevue";
import { ref } from "vue";
import EditPost from "@/components/Posts/EditPost.vue"; // Import EditPost
import { useReportModal } from "@/utils/useReportModal";

const { openReport } = useReportModal();

const props = defineProps({
  post: {
    type: Object,
    required: true,
  },
});
const authStore = useAuthStore();
// Tambahkan 'postUpdated' ke emits
const emit = defineEmits(["deletePost", "postUpdated"]);

const opPopover = ref(null);
const confirm = useConfirm();
const toast = useToast();

// State untuk Dialog Edit
const showEditDialog = ref(false);

const togglePopover = (event) => {
  opPopover.value.toggle(event);
};

// Handler untuk membuka dialog edit
const handleEditClick = () => {
  showEditDialog.value = true;
  // Tutup popover agar tidak menghalangi
  if (opPopover.value) {
    opPopover.value.hide();
  }
};

// Handler saat post selesai diupdate di komponen EditPost
const handlePostUpdated = () => {
  emit("postUpdated"); // Teruskan ke parent (PostCard)
};

const confirm1 = () => {
  confirm.require({
    message: "Do you want to delete this post?",
    header: "Danger Zone",
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
      <template v-if="post.user.id == authStore.user.id">
        <!-- Tambahkan @click="handleEditClick" -->
        <button type="button" @click="handleEditClick" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"><i class="fas fa-edit w-5 text-center text-gray-500"></i> Edit</button>
        <button type="button" @click="confirm1()" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"><i class="fas fa-trash w-5 text-center text-gray-500"></i> Delete</button>
      </template>
      <template v-else>
        <button type="button" @click="openReport('POST', post.id)" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100">
          <i class="fas fa-flag w-5 text-center text-gray-500"></i> Laporkan
        </button>
      </template>
    </Popover>

    <!-- Pasang Komponen EditPost di sini -->
    <!-- Dialog akan muncul di tengah layar (modal), jadi posisinya di DOM tree ini aman -->
    <EditPost v-model:visible="showEditDialog" :post="post" @postUpdated="handlePostUpdated" />
  </div>
</template>
