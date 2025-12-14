<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { useToast } from "primevue";
import NumberFlow from "@number-flow/vue";
import Editor from "primevue/editor";
import Menu from "primevue/menu";
import forumApi from "@/services/forumApi";
import communityApi from "@/services/communityApi";
import ForumAnswer from "@/components/Forums/ForumAnswer.vue";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import Image from "primevue/image";
import { useRouter } from "vue-router";
// IMPORT MODAL REPORT
import ReportModal from "@/components/Reports/ReportModal.vue";

const props = defineProps(["slug", "forumId"]);

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const forum = ref(null);
const community = ref(null);
const answers = ref([]);
const loading = ref(true);
const newAnswer = ref("");
const isSubmitting = ref(false);
const selectedFile = ref(null);
const filePreview = ref(null);

// State Voting Forum
const localVoteCount = ref(0);
const localUserVote = ref(0);
const isVoting = ref(false);

// State Report Modal
const showReportModal = ref(false);
const reportTarget = ref({ type: "", id: null });

// State Menu Forum
const forumMenu = ref(null);

// Computed Permissions
const isTopicOwner = computed(() => {
  return authStore.user && forum.value && authStore.user.id === forum.value.user_id;
});

// --- MENU FORUM ITEMS ---
const forumMenuItems = computed(() => {
  let items = [];
  if (isTopicOwner.value) {
    items.push(
      {
        label: "Edit Topik",
        icon: "fas fa-pen",
        command: () => {
          toast.add({ severity: "info", summary: "Info", detail: "Fitur edit belum diimplementasi", life: 3000 });
        },
      },
      {
        label: "Hapus",
        icon: "fas fa-trash",
        class: "text-red-600",
        command: async () => {
          if (confirm("Yakin ingin menghapus topik ini?")) {
            try {
              await forumApi.deleteForum(props.slug, props.forumId);
              toast.add({ severity: "success", summary: "Terhapus", detail: "Topik berhasil dihapus", life: 3000 });
              router.replace(`/communities/${props.slug}/forums`);
            } catch (e) {
              toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus topik", life: 3000 });
            }
          }
        },
      }
    );
  } else {
    items.push({
      label: "Laporkan",
      icon: "fas fa-flag",
      // Buka Modal Report untuk Tipe 'Forum'
      command: () => handleOpenReport("FORUM", props.forumId),
    });
  }
  return items;
});

const toggleForumMenu = (event) => {
  forumMenu.value.toggle(event);
};

// --- FETCH DATA ---
const loadData = async () => {
  loading.value = true;
  try {
    const [resForum, resAns, resComm] = await Promise.all([forumApi.getForumDetail(props.slug, props.forumId), forumApi.getResponds(props.slug, props.forumId), communityApi.getCommunityDetail(props.slug)]);

    forum.value = resForum.data.data;
    answers.value = resAns.data.data;
    community.value = resComm.data.data;

    localVoteCount.value = forum.value.vote_count || 0;
    localUserVote.value = forum.value.user_vote || 0;
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

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";
  return htmlContent.replace(/&nbsp;/g, " ");
};

// --- LOGIKA REPORT ---
const handleOpenReport = (type, id) => {
  reportTarget.value = { type, id };
  showReportModal.value = true;
};

// --- LOGIKA VOTING FORUM ---
const handleForumVote = async (type) => {
  if (isVoting.value) return;
  if (isTopicOwner.value) {
    toast.add({ severity: "warn", summary: "Info", detail: "Anda tidak bisa vote topik sendiri", life: 3000 });
    return;
  }

  const previousVote = localUserVote.value;
  const previousCount = localVoteCount.value;
  isVoting.value = true;

  // Tentukan nilai API (Selalu 1 atau -1)
  const apiPayload = type === "up" ? 1 : -1;

  try {
    // --- LOGIKA UI (Optimistic Update) ---
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

    // --- PANGGIL API ---
    // Kirim apiPayload (1 atau -1), JANGAN newVoteStatus
    await forumApi.voteForum(props.forumId, apiPayload);
  } catch (err) {
    console.error(err);
    localUserVote.value = previousVote;
    localVoteCount.value = previousCount;
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal melakukan voting", life: 3000 });
  } finally {
    isVoting.value = false;
  }
};

// --- SUBMIT JAWABAN ---
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

    if (selectedFile.value) {
      formData.append("media", selectedFile.value);
    }
    await forumApi.createRespond(props.slug, props.forumId, formData);
    toast.add({ severity: "success", summary: "Terkirim", detail: "Jawaban Anda telah diposting", life: 3000 });
    newAnswer.value = "";

    const resAns = await forumApi.getResponds(props.slug, props.forumId);
    answers.value = resAns.data.data;
    removeFile();
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengirim jawaban", life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

const onAnswerAccepted = async () => {
  const resAns = await forumApi.getResponds(props.slug, props.forumId);
  answers.value = resAns.data.data;
};

const handleFileChange = (event) => {
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

const removeFile = () => {
  selectedFile.value = null;
  filePreview.value = null;
  const input = document.getElementById("create-post-media-input");
  if (input) input.value = "";
};

// --- HANDLER EMIT DARI CHILD ---
const handleAnswerEdit = (answer) => {
  toast.add({ severity: "info", summary: "Info", detail: "Fitur edit jawaban belum diimplementasi", life: 3000 });
};

const handleAnswerDelete = async (answerId) => {
  if (confirm("Hapus jawaban ini?")) {
    try {
      await forumApi.deleteAnswer(props.slug, props.forumId, answerId);
      toast.add({ severity: "success", summary: "Terhapus", detail: "Jawaban dihapus", life: 3000 });
      const resAns = await forumApi.getResponds(props.slug, props.forumId);
      answers.value = resAns.data.data;
    } catch (e) {
      toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus jawaban", life: 3000 });
    }
  }
};

// Handler saat tombol Report diklik di Jawaban
const handleAnswerReport = (answer) => {
  handleOpenReport("FORUM_RESPOND", answer.id);
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
              </div>
              <span>•</span>
              <span>{{ formatDistanceToNow(new Date(forum.created_at), { addSuffix: true, locale: idLocale }) }}</span>
              <span>•</span>
              <span>{{ answers.length }} Jawaban</span>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row gap-8 items-start">
            <div class="w-full lg:w-3/4 flex flex-col gap-8">
              <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-6">
                <div class="flex flex-col items-center gap-1 min-w-10">
                  <button
                    v-tooltip.top="{
                      value: 'Pertanyaan ini jelas atau relevan',
                      pt: {
                        text: 'text-xs! text-center!',
                      },
                    }"
                    @click="handleForumVote('up')"
                    class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition focus:outline-none cursor-pointer"
                    :class="localUserVote === 1 ? 'text-blue-600' : 'text-gray-400'"
                    :disabled="isVoting"
                  >
                    <i class="fa-solid fa-caret-up text-3xl transform translate-y-0.5"></i>
                  </button>
                  <span class="font-bold text-lg text-gray-700 select-none"><NumberFlow :value="localVoteCount" /></span>
                  <button
                    v-tooltip.bottom="{
                      value: 'Pertanyaan ini kurang jelas atau kurang relevan',
                      pt: {
                        text: 'text-xs! text-center!',
                      },
                    }"
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

              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-gray-900 text-xl">{{ answers.length }} Jawaban</h3>
                </div>

                <div v-if="answers.length === 0" class="bg-blue-50 text-blue-800 p-4 rounded-lg text-center border border-blue-100">Belum ada jawaban. Jadilah yang pertama membantu!</div>

                <ForumAnswer
                  v-for="ans in answers"
                  :key="ans.id"
                  :answer="ans"
                  :isTopicOwner="isTopicOwner"
                  :communitySlug="slug"
                  :forumId="props.forumId"
                  @accepted="onAnswerAccepted"
                  @edit="handleAnswerEdit"
                  @delete="handleAnswerDelete"
                  @report="handleAnswerReport"
                />
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
                        <input id="create-post-media-input" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
                      </div>
                      <div v-else class="relative w-full">
                        <img :src="filePreview" class="max-h-[300px] w-auto mx-auto rounded-lg border border-gray-200 shadow-sm object-contain" />
                        <button @click="removeFile" type="button" class="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md transition z-10">
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

    <ReportModal v-model:visible="showReportModal" :reportableType="reportTarget.type" :reportableId="reportTarget.id" />
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
</style>
