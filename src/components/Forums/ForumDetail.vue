<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { useToast } from "primevue";
import Editor from "primevue/editor";
import forumApi from "@/services/forumApi";
import communityApi from "@/services/communityApi"; // Butuh ini untuk cek Role User
import ForumAnswer from "@/components/Forums/ForumAnswer.vue";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import LayoutDefaultUser from "@/layouts/LayoutDefaultUser.vue";
import Image from "primevue/image";
import { useRouter } from "vue-router";

// Props dari Router (URL Params)
const props = defineProps(["slug", "forumId"]);

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const forum = ref(null);
const community = ref(null); // Kita fetch sendiri datanya
const answers = ref([]);
const loading = ref(true);
const newAnswer = ref("");
const isSubmitting = ref(false);

// --- COMPUTED PERMISSIONS ---
// Cek apakah user adalah Pembuat Topik
const isTopicOwner = computed(() => {
  return authStore.user && forum.value && authStore.user.id === forum.value.user_id;
});

// --- FETCH DATA ---
const loadData = async () => {
  loading.value = true;
  try {
    // 1. Load Detail Forum & Jawaban (Paralel biar cepat)
    const [resForum, resAns, resComm] = await Promise.all([
      forumApi.getForumDetail(props.slug, props.forumId),
      forumApi.getResponds(props.slug, props.forumId),
      communityApi.getCommunityDetail(props.slug), // Fetch Community info (untuk tau role user)
    ]);

    forum.value = resForum.data.data;
    answers.value = resAns.data.data;
    community.value = resComm.data.data;
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      if (status === 403) {
        router.replace({ name: "ForbiddenPage" });
      } else if (status === 404) {
        router.replace({ name: "HomePage" });
      }
    }
    console.error(err);
    // toast.add({ severity: "error", summary: "Error", detail: "Gagal memuat diskusi", life: 3000 });
  } finally {
    loading.value = false;
  }
};

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";

  let cleaned = htmlContent.replace(/&nbsp;/g, " ");

  return cleaned;
};

// --- ACTIONS ---
const handleSubmitAnswer = async () => {
  if (!newAnswer.value) return;

  // Validasi Membership (Opsional: Jika komunitas privat, pastikan member)
  if (community.value.user_membership_status !== "GRANTED" && !community.value.is_public) {
    toast.add({ severity: "warn", summary: "Akses Terbatas", detail: "Anda harus bergabung untuk menjawab.", life: 3000 });
    return;
  }

  isSubmitting.value = true;
  try {
    const cleanAnswer = cleanContent(newAnswer.value);
    await forumApi.createRespond(props.slug, props.forumId, cleanAnswer);
    toast.add({ severity: "success", summary: "Terkirim", detail: "Jawaban Anda telah diposting", life: 3000 });
    newAnswer.value = "";

    // Reload jawaban saja agar efisien
    const resAns = await forumApi.getResponds(props.slug, props.forumId);
    answers.value = resAns.data.data;
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal mengirim jawaban", life: 3000 });
  } finally {
    isSubmitting.value = false;
  }
};

const onAnswerAccepted = async () => {
  // Reload data untuk update UI centang hijau
  const resAns = await forumApi.getResponds(props.slug, props.forumId);
  answers.value = resAns.data.data;
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
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              {{ forum.title }}
            </h1>

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
              <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div class="prose prose-blue w-full text-gray-800" v-html="forum.description"></div>

                <div v-if="forum.media_url" class="mt-6 pt-4 border-t border-gray-100">
                  <span class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block"> Lampiran </span>

                  <div class="rounded-lg overflow-hidden border border-gray-200 inline-block bg-gray-50">
                    <Image :src="forum.media_url" alt="Lampiran Masalah" preview imageClass="max-h-[400px] w-auto object-contain" />
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-bold text-gray-900 text-xl">{{ answers.length }} Jawaban</h3>
                </div>

                <div v-if="answers.length === 0" class="bg-blue-50 text-blue-800 p-4 rounded-lg text-center border border-blue-100">Belum ada jawaban. Jadilah yang pertama membantu!</div>

                <ForumAnswer v-for="ans in answers" :key="ans.id" :answer="ans" :isTopicOwner="isTopicOwner" :communitySlug="slug" :forumId="forumId" @accepted="onAnswerAccepted" />
              </div>

              <div class="flex flex-col gap-3 pt-4 border-t border-gray-200">
                <h3 class="font-bold text-gray-900 text-lg">Jawaban Anda</h3>
                <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <Editor v-model="newAnswer" editorStyle="height: 200px" placeholder="Tulis jawaban Anda di sini...">
                    <template v-slot:toolbar>
                      <span class="ql-formats">
                        <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                        <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                        <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                      </span>
                    </template>
                  </Editor>
                  <div class="bg-gray-50 p-3 flex justify-end border-t border-gray-200">
                    <button @click="handleSubmitAnswer" :disabled="isSubmitting" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm">
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
  </LayoutDefaultUser>
</template>

<style scoped>
/* Sedikit styling tambahan untuk Editor PrimeVue agar blend dengan desain */
:deep(.p-editor-toolbar) {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
:deep(.p-editor-content) {
  border: none;
}
</style>
