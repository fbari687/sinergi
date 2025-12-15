<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useAuthStore } from "@/store/auth";
import { useConfirm, useToast } from "primevue";
import NumberFlow from "@number-flow/vue";
import Editor from "primevue/editor";
import Dialog from "primevue/dialog";
import Menu from "primevue/menu";
import Dropdown from "primevue/dropdown"; // Import Dropdown Filter
import Paginator from "primevue/paginator"; // Import Pagination
import forumApi from "@/services/forumApi";
import communityApi from "@/services/communityApi";
import ForumAnswer from "@/components/Forums/ForumAnswer.vue";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import Image from "primevue/image";
import { useRouter } from "vue-router";
import { useReportModal } from "@/utils/useReportModal";

// --- SETUP ---
const { openReport } = useReportModal();
const props = defineProps(["slug", "forumId"]);
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

// --- STATE DATA ---
const forum = ref(null);
const community = ref(null);
const answers = ref([]);
const loading = ref(true); // Loading halaman awal
const loadingAnswers = ref(false); // Loading khusus list jawaban

// --- STATE FILTER & PAGINATION ---
const sortOption = ref("top"); // Default: Vote Terbanyak
const currentPage = ref(1);
const totalRecords = ref(0);
const rowsPerPage = ref(10); // Sesuai config backend

const sortOptions = [
  { label: "Vote Terbanyak", value: "top" },
  { label: "Terbaru", value: "newest" },
  { label: "Terlama", value: "oldest" },
];

// --- STATE CREATE ANSWER ---
const newAnswer = ref("");
const isSubmitting = ref(false);
const selectedFile = ref(null);
const filePreview = ref(null);

// --- STATE VOTING FORUM (TOPIK) ---
const localVoteCount = ref(0);
const localUserVote = ref(0);
const isVoting = ref(false);

// --- STATE EDIT TOPIK ---
const showEditDialog = ref(false);
const isUpdating = ref(false);
const editTopic = ref({ title: "", description: "" });
const editSelectedFile = ref(null);
const editFilePreview = ref(null);

// --- STATE MENU ---
const forumMenu = ref(null);

// --- COMPUTED ---
const isTopicOwner = computed(() => {
  return authStore.user && forum.value && authStore.user.id === forum.value.user_id;
});

const forumMenuItems = computed(() => {
  let items = [];
  if (isTopicOwner.value) {
    items.push(
      {
        label: "Edit Topik",
        icon: "fas fa-pen",
        command: () => openEditDialog(),
      },
      {
        label: "Hapus",
        icon: "fas fa-trash",
        class: "text-red-600",
        command: async () => confirmDelete(),
      }
    );
  } else {
    items.push({
      label: "Laporkan",
      icon: "fas fa-flag",
      command: () => openReport("FORUM", props.forumId),
    });
  }
  return items;
});

// --- HELPER FUNCTIONS ---
const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";
  return htmlContent.replace(/&nbsp;/g, " ");
};

const confirmDelete = () => {
  confirm.require({
    message: "Hapus pertanyaan ini?",
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
    await forumApi.deleteForum(props.forumId);
    toast.add({ severity: "success", summary: "Terhapus", detail: "Topik berhasil dihapus", life: 3000 });
    router.replace(`/communities/${props.slug}/forums`);
  } catch (e) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus topik", life: 3000 });
  }
};

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

const toggleForumMenu = (event) => {
  forumMenu.value.toggle(event);
};

// --- DATA FETCHING ---
const loadData = async () => {
  loading.value = true;
  try {
    const [resForum, resComm] = await Promise.all([forumApi.getForumDetail(props.slug, props.forumId), communityApi.getCommunityDetail(props.slug)]);

    forum.value = resForum.data.data;
    community.value = resComm.data.data;

    // Init Vote State
    localVoteCount.value = forum.value.vote_count || 0;
    localUserVote.value = forum.value.user_vote || 0;

    // Load Answers (Terpisah)
    await fetchAnswers();
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 403) router.replace({ name: "ForbiddenPage" });
      else if (status === 404) router.replace({ name: "HomePage" });
    }
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Fetch Jawaban dengan Filter & Page
const fetchAnswers = async () => {
  loadingAnswers.value = true;
  try {
    const res = await forumApi.getResponds(props.slug, props.forumId, sortOption.value, currentPage.value);

    // API Response Structure: { data: [...answers], meta: {...pagination} }
    const responseData = res.data.data;

    if (responseData.data && Array.isArray(responseData.data)) {
      answers.value = responseData.data;

      if (responseData.meta) {
        totalRecords.value = responseData.meta.total_items;
        rowsPerPage.value = responseData.meta.per_page;
      } else {
        totalRecords.value = answers.value.length;
      }
    } else {
      // Fallback jika API backend belum update format meta
      answers.value = responseData;
      totalRecords.value = answers.value.length;
    }
  } catch (error) {
    console.error("Gagal memuat jawaban", error);
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat jawaban" });
  } finally {
    loadingAnswers.value = false;
  }
};

// Watcher Filter Sort
watch(sortOption, () => {
  currentPage.value = 1; // Reset ke page 1 jika sort berubah
  fetchAnswers();
});

// Handler Pagination
const onPageChange = (event) => {
  currentPage.value = event.page + 1; // PrimeVue index 0-based
  fetchAnswers();
  // Auto scroll ke section jawaban
  document.getElementById("answers-section")?.scrollIntoView({ behavior: "smooth" });
};

// Handler Refresh dari Child (ForumAnswer)
const handleRefreshAnswers = async () => {
  await fetchAnswers();
};

const onAnswerAccepted = async () => {
  await fetchAnswers(); // Reload agar posisi jawaban accepted naik ke atas
};

// --- LOGIKA VOTING TOPIK ---
const handleForumVote = async (type) => {
  if (isVoting.value) return;
  if (isTopicOwner.value) {
    toast.add({ severity: "warn", summary: "Info", detail: "Anda tidak bisa vote topik sendiri", life: 3000 });
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
    await forumApi.voteForum(props.forumId, apiPayload);
  } catch (err) {
    localUserVote.value = previousVote;
    localVoteCount.value = previousCount;
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal melakukan voting", life: 3000 });
  } finally {
    isVoting.value = false;
  }
};

// --- LOGIKA EDIT TOPIK ---
const openEditDialog = () => {
  editTopic.value = { title: forum.value.title, description: forum.value.description };
  editFilePreview.value = forum.value.media_url;
  editSelectedFile.value = null;
  showEditDialog.value = true;
};

const handleEditFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    editSelectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      editFilePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else if (file) {
    toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
  }
};

const removeEditFile = () => {
  editSelectedFile.value = null;
  editFilePreview.value = null;
  const input = document.getElementById("edit-forum-media-input");
  if (input) input.value = "";
};

const handleUpdateTopic = async () => {
  if (!editTopic.value.title || !editTopic.value.description) {
    toast.add({ severity: "warn", summary: "Gagal", detail: "Judul dan Deskripsi wajib diisi", life: 3000 });
    return;
  }
  isUpdating.value = true;
  try {
    const formData = new FormData();
    formData.append("title", editTopic.value.title);
    formData.append("description", cleanContent(editTopic.value.description));

    if (editSelectedFile.value) {
      formData.append("media", editSelectedFile.value);
    } else if (!editFilePreview.value && !editSelectedFile.value) {
      formData.append("delete_media", "true");
    }

    const res = await forumApi.updateForum(props.slug, props.forumId, formData);
    forum.value = res.data.data; // Update UI Lokal
    toast.add({ severity: "success", summary: "Berhasil", detail: "Topik diskusi diperbarui", life: 3000 });
    showEditDialog.value = false;
  } catch (err) {
    toast.add({ severity: "error", summary: "Error", detail: "Gagal memperbarui topik", life: 3000 });
  } finally {
    isUpdating.value = false;
  }
};

// --- LOGIKA CREATE JAWABAN ---
const handleCreateFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.size <= 5 * 1024 * 1024) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      filePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else if (file) {
    toast.add({ severity: "warn", summary: "File Terlalu Besar", detail: "Maksimal 5MB", life: 3000 });
  }
};

const removeCreateFile = () => {
  selectedFile.value = null;
  filePreview.value = null;
  const input = document.getElementById("create-post-media-input");
  if (input) input.value = "";
};

const handleSubmitAnswer = async () => {
  if (!newAnswer.value) return;
  if (community.value.user_membership_status !== "GRANTED" && !community.value.is_public) {
    toast.add({ severity: "warn", summary: "Akses Terbatas", detail: "Anda harus bergabung untuk menjawab.", life: 3000 });
    return;
  }
  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append("message", cleanContent(newAnswer.value));
    formData.append("parent_id", null);
    if (selectedFile.value) formData.append("media", selectedFile.value);

    await forumApi.createRespond(props.slug, props.forumId, formData);
    toast.add({ severity: "success", summary: "Terkirim", detail: "Jawaban Anda telah diposting", life: 3000 });

    // Reset Form
    newAnswer.value = "";
    removeCreateFile();

    // Reset Filter ke Terbaru & Page 1 agar user melihat jawabannya
    sortOption.value = "newest";
    currentPage.value = 1;
    await fetchAnswers();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengirim jawaban", life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <LayoutDefaultUser :useRightSidebar="false">
    <div class="grow bg-gray-50 pb-20 pt-4 md:pt-0 md:mt-20">
      <div class="border-b border-gray-200 px-4 py-3">
        <div class="max-w-5xl mx-auto flex items-center gap-2 text-sm">
          <RouterLink to="/" class="text-gray-500 hover:text-blue-600">Beranda</RouterLink>
          <span class="text-gray-300">/</span>
          <RouterLink :to="`/communities/${slug}/forums`" class="font-semibold text-gray-600 hover:text-blue-600 truncate max-w-[150px] md:max-w-xs">
            {{ community?.name || "Komunitas" }}
          </RouterLink>
          <span class="text-gray-300">/</span>
          <span class="text-gray-400 truncate max-w-[100px] md:max-w-xs">Detail Diskusi</span>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-4 mt-6 flex flex-col gap-6">
        <div v-if="loading" class="flex flex-col items-center py-20 gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
          <span class="text-gray-500">Memuat diskusi...</span>
        </div>

        <template v-else-if="forum">
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-start">
              <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight w-full pr-4">
                {{ forum.title }}
              </h1>
              <div class="shrink-0 relative">
                <button
                  @click="toggleForumMenu"
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full aspect-square w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition focus:outline-none cursor-pointer"
                  aria-haspopup="true"
                  aria-controls="forum_menu"
                >
                  <i class="fa-solid fa-ellipsis-vertical text-xl"></i>
                </button>
                <Menu ref="forumMenu" id="forum_menu" :model="forumMenuItems" :popup="true">
                  <template #item="{ item, props }">
                    <a v-ripple class="flex items-center" v-bind="props.action">
                      <span :class="[item.icon, item.class]" class="mr-2" />
                      <span :class="item.class">{{ item.label }}</span>
                    </a>
                  </template>
                </Menu>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-200 pb-4">
              <div class="flex items-center gap-2">
                <span class="text-gray-400">Ditanya oleh</span>
                <img :src="forum.profile_picture_url || 'https://ui-avatars.com/api/?name=' + forum.fullname" class="w-5 h-5 rounded-full" />
                <RouterLink :to="`/profile/${forum.username}`" class="font-medium text-blue-600 hover:underline">{{ forum.fullname }}</RouterLink>
                <span v-if="forum.user_id != authStore.user.id" class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full cursor-default" :class="getRoleColor(forum.role_name)">
                  {{ forum.role_name }}
                </span>
                <span v-else class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full cursor-default" :class="getRoleColor('default')"> Anda </span>
              </div>
              <span>•</span>
              <span>{{ formatDistanceToNow(new Date(forum.created_at), { addSuffix: true, locale: idLocale }) }}</span>
              <span>•</span>
              <span>{{ totalRecords }} Jawaban</span>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8 items-start">
            <div class="w-full lg:w-3/4 flex flex-col gap-8">
              <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-6">
                <div class="flex flex-col items-center gap-1 min-w-10">
                  <button
                    @click="handleForumVote('up')"
                    class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
                    :class="localUserVote === 1 ? 'text-blue-600' : 'text-gray-400'"
                    :disabled="isVoting"
                  >
                    <i class="fa-solid fa-caret-up text-3xl transform translate-y-0.5"></i>
                  </button>
                  <span class="font-bold text-lg text-gray-700 select-none"><NumberFlow :value="localVoteCount" /></span>
                  <button
                    @click="handleForumVote('down')"
                    class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
                    :class="localUserVote === -1 ? 'text-blue-600' : 'text-gray-400'"
                    :disabled="isVoting"
                  >
                    <i class="fa-solid fa-caret-down text-3xl transform -translate-y-0.5"></i>
                  </button>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="prose prose-blue w-full text-gray-800" v-html="forum.description"></div>
                  <div v-if="forum.media_url" class="mt-6 pt-4 border-t border-gray-100">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block"> Lampiran </span>
                    <div class="rounded-lg overflow-hidden border border-gray-200 inline-block bg-gray-50">
                      <Image :src="forum.media_url" alt="Lampiran Masalah" preview imageClass="max-h-[400px] w-auto object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              <div id="answers-section" class="flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pb-2 border-b border-gray-200">
                  <h3 class="font-bold text-gray-900 text-xl">{{ totalRecords }} Jawaban</h3>
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">Urutkan:</span>
                    <Dropdown v-model="sortOption" :options="sortOptions" optionLabel="label" optionValue="value" class="w-40 md:w-48 text-sm" />
                  </div>
                </div>

                <div v-if="loadingAnswers" class="flex flex-col items-center py-10">
                  <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
                </div>

                <div v-else-if="answers.length === 0" class="bg-blue-50 text-blue-800 p-6 rounded-lg text-center border border-blue-100 flex flex-col items-center gap-2">
                  <i class="fa-regular fa-comments text-4xl opacity-50"></i>
                  <p>Belum ada jawaban. Jadilah yang pertama membantu!</p>
                </div>

                <template v-else>
                  <ForumAnswer v-for="ans in answers" :key="ans.id" :answer="ans" :isTopicOwner="isTopicOwner" :communitySlug="slug" :forumId="props.forumId" @accepted="onAnswerAccepted" @refresh="handleRefreshAnswers" />

                  <Paginator
                    v-if="totalRecords > rowsPerPage"
                    :rows="rowsPerPage"
                    :totalRecords="totalRecords"
                    :first="(currentPage - 1) * rowsPerPage"
                    @page="onPageChange"
                    template="PrevPageLink PageLinks NextPageLink"
                    class="mt-4 bg-transparent! border-none!"
                  />
                </template>
              </div>

              <div class="flex flex-col gap-3 pt-4 border-t border-gray-200">
                <h3 class="font-bold text-gray-900 text-lg">Jawaban Anda</h3>
                <div class="bg-white rounded-xl overflow-hidden">
                  <Editor v-model="newAnswer" editorStyle="height: 200px" placeholder="Tulis jawaban Anda di sini...">
                    <template v-slot:toolbar>
                      <span class="ql-formats">
                        <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                        <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                        <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                      </span>
                    </template>
                  </Editor>
                  <div class="w-full flex flex-col gap-2 mt-4">
                    <label class="font-bold text-sm text-gray-700">Lampirkan Gambar (Opsional)</label>
                    <div class="border border-dashed border-gray-300 rounded-lg p-4 bg-white flex flex-col items-center justify-center gap-2 transition hover:bg-gray-100">
                      <div v-if="!filePreview" class="w-full text-center">
                        <label for="create-post-media-input" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition p-4 w-full h-full">
                          <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
                          <span class="text-sm font-medium">Klik untuk upload gambar</span>
                          <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                        </label>
                        <input id="create-post-media-input" type="file" accept="image/*" class="hidden" @change="handleCreateFileChange" />
                      </div>
                      <div v-else class="relative w-full">
                        <img :src="filePreview" class="max-h-[300px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />
                        <button @click="removeCreateFile" type="button" class="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition z-10">
                          <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                        <p class="text-center text-xs text-gray-500 mt-2 truncate">{{ selectedFile.name }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="bg-gray-50 p-3 flex justify-end border-t border-gray-200">
                    <button @click="handleSubmitAnswer" :disabled="isSubmitting" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold cursor-pointer hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
                      {{ isSubmitting ? "Mengirim..." : "Kirim Jawaban" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="hidden lg:flex w-1/4 flex-col gap-4 sticky top-32">
              <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <h4 class="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Tentang Komunitas</h4>
                <div class="flex items-center gap-3 mb-3">
                  <img :src="community?.thumbnail_url" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <div class="flex flex-col overflow-hidden">
                    <span class="font-bold text-gray-900 truncate">{{ community?.name }}</span>
                    <span class="text-xs text-gray-500">{{ community?.total_members }} Anggota</span>
                  </div>
                </div>
                <RouterLink :to="`/communities/${slug}/forums`" class="block w-full text-center py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition"> Kembali ke Daftar Topik </RouterLink>
              </div>
              <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <span class="font-bold block mb-1">Tips Bertanya:</span>
                <ul class="list-disc pl-4 space-y-1 text-xs">
                  <li>Jelaskan masalah dengan detail.</li>
                  <li>Gunakan bahasa yang sopan.</li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <Dialog v-model:visible="showEditDialog" modal header="Edit Topik Diskusi" :style="{ width: '800px' }">
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">Judul Pertanyaan</label>
          <input v-model="editTopic.title" type="text" class="border p-2 rounded-lg w-full focus:ring-2 focus:ring-blue-200 outline-none" placeholder="Judul Topik" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">Detail Masalah</label>
          <Editor v-model="editTopic.description" editorStyle="height: 200px">
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
            <div v-if="!editFilePreview" class="w-full text-center">
              <label for="edit-forum-media-input" class="cursor-pointer flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
                <span class="text-sm font-medium">Ganti / Upload Gambar</span>
                <span class="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
              </label>
              <input id="edit-forum-media-input" type="file" accept="image/*" class="hidden" @change="handleEditFileChange" />
            </div>
            <div v-else class="relative w-full">
              <img :src="editFilePreview" class="max-h-[200px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />
              <button @click="removeEditFile" class="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition cursor-pointer" title="Hapus gambar">
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
              <p v-if="editSelectedFile" class="text-center text-xs text-gray-500 mt-2">{{ editSelectedFile.name }}</p>
              <p v-else class="text-center text-xs text-blue-500 mt-2 font-semibold">Gambar saat ini</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button @click="showEditDialog = false" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg cursor-pointer">Batal</button>
        <button @click="handleUpdateTopic" :disabled="isUpdating" class="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
          <i v-if="isUpdating" class="fa-solid fa-circle-notch fa-spin"></i>
          <span>{{ isUpdating ? "Menyimpan..." : "Simpan Perubahan" }}</span>
        </button>
      </template>
    </Dialog>
  </LayoutDefaultUser>
</template>

<style scoped>
:deep(.p-editor-toolbar) {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
:deep(.p-editor-content) {
  border: none;
}
:deep(.p-menu) {
  font-size: 0.875rem;
  min-width: 10rem;
}
:deep(.p-dropdown) {
  border-radius: 0.5rem;
}
:deep(.p-dropdown-label) {
  padding: 0.5rem 0.75rem;
}
:deep(.p-paginator) {
  justify-content: center;
}
</style>
