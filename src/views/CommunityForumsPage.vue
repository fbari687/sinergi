<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "primevue";
import Dialog from "primevue/dialog";
import Editor from "primevue/editor";
import forumApi from "@/services/forumApi";
import communityApi from "@/services/communityApi"; // Import communityApi untuk fungsi Join
import ForumCard from "@/components/Forums/ForumCard.vue";
import _ from "lodash";

const route = useRoute();
const toast = useToast();
const props = defineProps(["community"]);

// Emits untuk refresh parent (Wrapper)
const emit = defineEmits(["refreshCommunity"]);

const forums = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const page = ref(1);
const hasMore = ref(true); // State Infinite Scroll

// State untuk Modal Create
const showCreateDialog = ref(false);
const newTopic = ref({ title: "", description: "" });
const isSubmitting = ref(false);

const selectedFile = ref(null);
const filePreview = ref(null);

// State Hak Akses
const canViewForums = ref(false);

// State Join
const isJoining = ref(false);

// --- COMPUTED PROPERTIES ---
const isMember = computed(() => {
  return props.community?.user_membership_status === "GRANTED";
});

// Guest: Komunitas Publik TAPI Belum Join
const isGuest = computed(() => {
  return props.community?.is_public && !isMember.value;
});

// --- LOGIKA CEK AKSES ---
const checkAccess = () => {
  const isPublic = props.community?.is_public;

  if (isPublic || isMember.value) {
    canViewForums.value = true;
    loadForums(true);
  } else {
    canViewForums.value = false;
  }
};

const loadForums = async (isReset = false) => {
  if (!canViewForums.value) return;

  if (isReset) {
    loading.value = true;
    page.value = 1;
    hasMore.value = true;
    forums.value = [];
  }

  try {
    const res = await forumApi.getForums(props.community.slug, searchQuery.value, page.value);
    const newForums = res.data.data;

    if (newForums.length === 0) {
      hasMore.value = false;
    } else {
      if (newForums.length < 10) {
        // Asumsi limit pagination backend 10
        hasMore.value = false;
      }

      if (isReset) {
        forums.value = newForums;
      } else {
        forums.value.push(...newForums);
      }

      // --- LOGIC PEMBATASAN GUEST ---
      // Jika Guest dan sudah ada 5 atau lebih item, stop load page berikutnya
      // dan potong array jadi 5 saja (jika kebetulan API balikin lebih)
      if (isGuest.value && forums.value.length >= 5) {
        hasMore.value = false;
        forums.value = forums.value.slice(0, 5);
      } else if (hasMore.value) {
        page.value++;
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleJoin = async () => {
  isJoining.value = true;
  try {
    await communityApi.joinCommunity(props.community.slug);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Anda berhasil bergabung!", life: 3000 });

    // Refresh
    emit("refreshCommunity");
    setTimeout(() => window.location.reload(), 1000); // Reload agar state bersih
  } catch (error) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal bergabung komunitas.", life: 3000 });
  } finally {
    isJoining.value = false;
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  filePreview.value = null;
  const input = document.getElementById("forum-media-input");
  if (input) input.value = "";
};

const handleSearch = _.debounce(() => {
  if (canViewForums.value) {
    loadForums(true);
  }
}, 500);

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";

  let cleaned = htmlContent.replace(/&nbsp;/g, " ");

  return cleaned;
};

const handleCreateTopic = async () => {
  if (!newTopic.value.title || !newTopic.value.description) {
    toast.add({ severity: "warn", summary: "Gagal", detail: "Judul dan Deskripsi wajib diisi", life: 3000 });
    return;
  }

  isSubmitting.value = true;
  try {
    const finalDescription = cleanContent(newTopic.value.description);
    const formData = new FormData();
    formData.append("title", newTopic.value.title);
    formData.append("description", finalDescription);

    if (selectedFile.value) {
      formData.append("media", selectedFile.value);
    }

    await forumApi.createForum(props.community.slug, formData);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Topik diskusi berhasil dibuat", life: 3000 });

    showCreateDialog.value = false;
    newTopic.value = { title: "", description: "" };
    removeFile();
    loadForums(true);
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal membuat topik", life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

// Infinite Scroll Observer
const observer = ref(null);
const loadTrigger = ref(null);

onMounted(() => {
  checkAccess();

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      // Jangan load next page jika Guest (karena dibatasi 5)
      if (entry.isIntersecting && hasMore.value && !loading.value && !isGuest.value) {
        loadForums();
      }
    },
    { rootMargin: "200px" }
  );
});

watch(loadTrigger, (el) => {
  if (el && observer.value) {
    observer.value.observe(el);
  }
});

onUnmounted(() => {
  if (observer.value) observer.value.disconnect();
});
</script>

<template>
  <template v-if="!canViewForums">
    <div class="w-full flex justify-center">
      <div class="w-full max-w-[600px] bg-white border border-gray-200 rounded-xl p-8 mt-5 text-center text-gray-500 flex flex-col items-center">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fa-solid fa-lock text-3xl text-gray-400"></i>
        </div>
        <h4 class="font-bold text-lg text-gray-900 mb-1">Komunitas Ini Privat</h4>
        <p class="text-sm">Anda harus menjadi anggota untuk melihat diskusi di komunitas ini.</p>
      </div>
    </div>
  </template>

  <template v-else>
    <div class="w-full flex flex-col gap-4 pb-20 pt-4 lg:pt-2">
      <div class="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="font-bold text-xl text-gray-900">Forum Diskusi</h2>
          <p class="text-sm text-gray-500">Tempat bertanya dan berbagi solusi.</p>
        </div>
        <button v-if="isMember" @click="showCreateDialog = true" class="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition flex items-center gap-2">
          <i class="fa-solid fa-pen-to-square"></i> Buat Pertanyaan
        </button>
      </div>

      <div v-if="isMember" class="relative w-full">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Cari topik diskusi..." class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
      </div>

      <div class="flex flex-col gap-3">
        <div v-if="loading && page === 1" class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500"></i> Memuat...</div>

        <div v-else-if="forums.length === 0" class="text-center py-10 bg-white rounded-xl border border-gray-200">
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" class="w-40 mx-auto opacity-50 mb-4" />
          <p class="text-gray-500">Belum ada topik diskusi. Jadilah yang pertama bertanya!</p>
        </div>

        <template v-else>
          <ForumCard v-for="forum in forums" :key="forum.id" :forum="forum" :communitySlug="props.community.slug" :is-member="isMember" />

          <div v-if="isGuest && forums.length >= 5" class="w-full bg-blue-50 border border-blue-100 rounded-xl p-6 mt-4 text-center shadow-sm">
            <i class="fa-solid fa-comments text-3xl text-blue-500 mb-3"></i>
            <h3 class="font-bold text-gray-900 text-lg">Tertarik dengan diskusi ini?</h3>
            <p class="text-sm text-gray-600 mb-4">
              Bergabung dengan komunitas <b>{{ community.name }}</b> untuk melihat seluruh diskusi, bertanya, dan menjawab.
            </p>

            <button
              @click="handleJoin"
              :disabled="isJoining"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
            >
              <i v-if="isJoining" class="fa-solid fa-circle-notch fa-spin"></i>
              <span>{{ isJoining ? "Bergabung..." : "Gabung Komunitas" }}</span>
            </button>
          </div>

          <div v-else ref="loadTrigger" class="h-10 flex items-center justify-center w-full mt-2">
            <i v-if="hasMore" class="fa-solid fa-circle-notch fa-spin text-blue-500 text-xl"></i>
          </div>
        </template>
      </div>

      <Dialog v-model:visible="showCreateDialog" modal header="Buat Pertanyaan Baru" :style="{ width: '800px' }">
        <div class="flex flex-col gap-4 pt-2">
          <div class="flex flex-col gap-1">
            <label class="font-bold text-sm text-gray-700">Judul Pertanyaan</label>
            <input v-model="newTopic.title" type="text" class="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Contoh: Error saat install dependency..." />
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-bold text-sm text-gray-700">Detail Masalah</label>
            <Editor v-model="newTopic.description" editorStyle="height: 200px">
              <template v-slot:toolbar>
                <span class="ql-formats">
                  <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                  <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                  <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                </span>
              </template>
            </Editor>
          </div>

          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm text-gray-700">Lampirkan Gambar (Opsional)</label>

            <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <div v-if="!filePreview" class="w-full text-center">
                <label for="forum-media-input" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                  <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
                  <span class="text-sm font-medium">Klik untuk upload gambar</span>
                  <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </label>
                <input id="forum-media-input" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
              </div>

              <div v-else class="relative w-full">
                <img :src="filePreview" class="max-h-[200px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm" />

                <button @click="removeFile" class="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition" title="Hapus gambar">
                  <i class="fa-solid fa-xmark text-xs"></i>
                </button>

                <p class="text-center text-xs text-gray-500 mt-2">{{ selectedFile.name }}</p>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <button @click="showCreateDialog = false" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg cursor-pointer">Batal</button>
          <button @click="handleCreateTopic" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
            <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
            <span>{{ isSubmitting ? "Mengirim..." : "Kirim Pertanyaan" }}</span>
          </button>
        </template>
      </Dialog>
    </div>
  </template>
</template>
