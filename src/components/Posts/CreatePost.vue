<script setup>
import postApi from "@/services/postApi";
import { useAuthStore } from "@/store/auth";
import { Button, Dialog } from "primevue";
import Editor from "primevue/editor";
import { ref } from "vue";
import { useToast } from "primevue";

const authStore = useAuthStore();
const toast = useToast();

const props = defineProps({
  communityName: {
    type: String,
    required: false,
    default: null,
  },
  communitySlug: {
    type: String,
    required: false,
    default: null,
  },
});
const emit = defineEmits(["postCreated"]);

const visible = ref(false);

// State untuk File Upload (Gaya Baru)
const selectedFile = ref(null);
const filePreview = ref(null);

const description = ref("");
const loading = ref(false);
const error = ref(null);

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";

  let cleaned = htmlContent.replace(/&nbsp;/g, " ");

  return cleaned;
};

const handleSubmit = async () => {
  loading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    const finalDescription = cleanContent(description.value);
    formData.append("description", finalDescription);

    // Gunakan state selectedFile yang baru
    if (selectedFile.value) {
      formData.append("media", selectedFile.value);
    }

    if (props.communitySlug === null) {
      await postApi.createPostHome(formData);
    } else {
      await postApi.createPostCommunities(formData, props.communitySlug);
    }

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: "Postingan berhasil dibuat!",
      life: 3000,
    });
    emit("postCreated");

    visible.value = false;
    description.value = ""; // Reset editor
    removeFile(); // Reset file dan preview
  } catch (err) {
    const errorMessage = err.response?.data?.meta?.message || "Gagal membuat post";
    error.value = errorMessage;
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};

// Fungsi Handle File Change (Mirip CommunityForumsPage)
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validasi Ukuran (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    selectedFile.value = file;

    // Buat Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Fungsi Hapus File
const removeFile = () => {
  selectedFile.value = null;
  filePreview.value = null;
  // Reset input file (trik HTML DOM)
  const input = document.getElementById("create-post-media-input");
  if (input) input.value = "";
};
</script>

<template>
  <article class="w-full bg-white border border-gray-200 rounded-xl mb-5 group p-4 flex flex-col gap-2">
    <div class="w-full flex gap-2">
      <img :src="authStore.user.profile_picture" class="min-w-10 w-10 min-h-10 h-10 md:w-12 md:min-w-12 md:h-12 md:min-h-12 rounded-full object-cover" alt="profile picture" />
      <button @click="visible = true" type="button" class="cursor-text w-full border border-gray-300 bg-gray-200 rounded-full text-start px-4 hover:bg-gray-300 transition-colors">
        <span class="text-gray-500 text-sm md:text-base">Buat Postingan...</span>
      </button>
    </div>
  </article>

  <Dialog v-model:visible="visible" modal header="Buat Postingan" class="w-full max-w-2xl mx-4">
    <form @submit.prevent="handleSubmit" class="w-full flex flex-col gap-4 border-t py-2">
      <div class="flex gap-2 items-center mt-2">
        <img :src="authStore.user.profile_picture" class="w-12 h-12 rounded-full object-cover" alt="profile picture" />
        <div class="flex flex-col gap-0.5">
          <h3 class="font-bold text-base text-gray-900">{{ authStore.user.fullname }}</h3>
          <h5 class="w-fit text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium line-clamp-1">
            {{ communityName ?? "Home" }}
          </h5>
        </div>
      </div>

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

      <div class="w-full flex flex-col gap-2">
        <label class="font-bold text-sm text-gray-700">Lampirkan Gambar (Opsional)</label>

        <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center gap-2 transition hover:bg-gray-100">
          <div v-if="!filePreview" class="w-full text-center">
            <label for="create-post-media-input" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition p-4 w-full h-full">
              <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
              <span class="text-sm font-medium">Klik untuk upload gambar</span>
              <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
            </label>
            <input id="create-post-media-input" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
          </div>

          <div v-else class="relative w-full">
            <img :src="filePreview" class="max-h-[300px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />

            <button @click="removeFile" type="button" class="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition z-10" title="Hapus gambar">
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>

            <p class="text-center text-xs text-gray-500 mt-2 truncate">{{ selectedFile.name }}</p>
          </div>
        </div>
      </div>

      <div class="w-full border-t pt-4 mt-2">
        <div class="flex justify-end gap-2">
          <button @click="visible = false" type="button" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Batal</button>
          <Button
            type="submit"
            label="Post"
            class="bg-blue-600! hover:bg-blue-700! text-white border-none px-6 h-10 rounded-lg text-sm font-bold cursor-pointer transition-colors duration-300 flex items-center gap-2"
            :loading="loading"
            :disabled="!description && !selectedFile"
          />
        </div>
      </div>
    </form>
  </Dialog>
</template>

<style scoped></style>
