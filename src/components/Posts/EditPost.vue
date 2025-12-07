<script setup>
import postApi from "@/services/postApi";
import { useAuthStore } from "@/store/auth";
import { Button, Dialog } from "primevue";
import Editor from "primevue/editor";
import { ref, watch, toRef } from "vue";
import { useToast } from "primevue";

const authStore = useAuthStore();
const toast = useToast();

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  post: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:visible", "postUpdated"]);

const isVisible = toRef(props, "visible");

// State Form
const description = ref("");
const selectedFile = ref(null);
const filePreview = ref(null);
const loading = ref(false);

// [BARU] State untuk melacak apakah gambar dihapus
const isMediaDeleted = ref(false);

// --- WATCHER: ISI FORM SAAT DIALOG DIBUKA ---
watch(isVisible, (newVal) => {
  if (newVal && props.post) {
    description.value = props.post.description || "";

    // Reset state
    selectedFile.value = null;
    isMediaDeleted.value = false; // Reset flag hapus

    if (props.post.media_url) {
      filePreview.value = props.post.media_url;
    } else {
      filePreview.value = null;
    }
  }
});

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";
  let cleaned = htmlContent.replace(/&nbsp;/g, " ");
  return cleaned;
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    selectedFile.value = file;
    isMediaDeleted.value = false; // Jika upload baru, flag hapus dimatikan

    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// [DIUBAH] Fungsi Hapus File sekarang benar-benar menghapus
const removeFile = () => {
  selectedFile.value = null;
  filePreview.value = null;

  // Reset input file
  const input = document.getElementById("edit-post-media-input");
  if (input) input.value = "";

  // Set flag bahwa user ingin menghapus gambar (baik gambar lama maupun batal upload baru)
  isMediaDeleted.value = true;
};

const handleSubmit = async () => {
  loading.value = true;

  try {
    const formData = new FormData();

    const finalDescription = cleanContent(description.value);
    formData.append("description", finalDescription);

    // 1. Append Media BARU (jika ada)
    if (selectedFile.value) {
      formData.append("media", selectedFile.value);
    }

    // 2. [BARU] Kirim flag hapus ke backend
    // Jika isMediaDeleted true DAN tidak ada file baru yang dipilih
    if (isMediaDeleted.value && !selectedFile.value) {
      formData.append("delete_media", "true");
    }

    await postApi.updatePost(props.post.id, formData);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Postingan diperbarui!", life: 3000 });

    emit("postUpdated");
    handleClose();
  } catch (err) {
    const errorMessage = err.response?.data?.meta?.message || "Gagal mengupdate post";
    toast.add({ severity: "error", summary: "Gagal", detail: errorMessage, life: 5000 });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Edit Postingan" class="w-full max-w-2xl mx-4" :draggable="false">
    <form @submit.prevent="handleSubmit" class="w-full flex flex-col gap-4 border-t py-2">
      <!-- User Info Header -->
      <div class="flex gap-2 items-center mt-2">
        <img :src="authStore.user.profile_picture" class="w-12 h-12 rounded-full object-cover" alt="profile picture" />
        <div class="flex flex-col gap-0.5">
          <h3 class="font-bold text-base text-gray-900">{{ authStore.user.fullname }}</h3>
          <span class="text-xs text-gray-500">Mengedit postingan</span>
        </div>
      </div>

      <!-- Editor -->
      <div class="w-full">
        <Editor v-model="description" editorStyle="height: 200px">
          <template v-slot:toolbar>
            <span class="ql-formats">
              <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
              <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
              <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
            </span>
          </template>
        </Editor>
      </div>

      <!-- Image Upload / Preview -->
      <div class="w-full flex flex-col gap-2">
        <label class="font-bold text-sm text-gray-700">Media</label>

        <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center gap-2 transition hover:bg-gray-100">
          <input id="edit-post-media-input" type="file" accept="image/*" class="hidden" @change="handleFileChange" />

          <!-- Kondisi 1: Tidak ada gambar sama sekali -->
          <div v-if="!filePreview" class="w-full text-center">
            <label for="edit-post-media-input" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition p-4 w-full h-full">
              <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
              <span class="text-sm font-medium">
                {{ isMediaDeleted ? "Gambar dihapus. Klik untuk upload baru." : "Upload Gambar" }}
              </span>
              <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
            </label>
          </div>

          <!-- Kondisi 2: Ada preview -->
          <div v-else class="relative w-full">
            <div class="text-xs text-gray-500 mb-2 text-center">
              {{ selectedFile ? "Gambar Baru terpilih:" : "Gambar saat ini:" }}
            </div>

            <img :src="filePreview" class="max-h-[300px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />

            <!-- Tombol Hapus (X) -->
            <!-- Tombol ini sekarang akan memicu isMediaDeleted = true -->
            <button @click="removeFile" type="button" class="absolute top-8 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition z-10" title="Hapus gambar">
              <i class="fa-solid fa-trash text-sm"></i>
            </button>

            <label for="edit-post-media-input" class="mt-3 cursor-pointer text-blue-600 text-sm hover:underline block text-center"> Ganti Gambar </label>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="w-full border-t pt-4 mt-2">
        <div class="flex justify-end gap-2">
          <button @click="handleClose" type="button" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Batal</button>
          <Button
            type="submit"
            label="Simpan Perubahan"
            class="bg-blue-600! hover:bg-blue-700! text-white border-none px-6 h-10 rounded-lg text-sm font-bold cursor-pointer transition-colors duration-300 flex items-center gap-2"
            :loading="loading"
            :disabled="!description && !filePreview"
          />
        </div>
      </div>
    </form>
  </Dialog>
</template>

<style scoped></style>
