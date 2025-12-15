<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useConfirm, useToast } from "primevue";
import { useRouter } from "vue-router";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import LayoutAdminUser from "@/components/Admins/Layouts/LayoutAdminUser.vue";
import ForumAnswer from "@/components/Forums/ForumAnswer.vue";
import forumApi from "@/services/forumApi";
import communityApi from "@/services/communityApi";

import NumberFlow from "@number-flow/vue";
import Image from "primevue/image";
import Menu from "primevue/menu";
import Dropdown from "primevue/dropdown";
import Paginator from "primevue/paginator";

const props = defineProps(["slug", "forumId"]);
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// DATA
const forum = ref(null);
const answers = ref([]);
const loading = ref(true);
const loadingAnswers = ref(false);

// FILTER & PAGINATION
const sortOption = ref("top");
const currentPage = ref(1);
const totalRecords = ref(0);
const rowsPerPage = ref(10);
const sortOptions = [
  { label: "Vote Terbanyak", value: "top" },
  { label: "Terbaru", value: "newest" },
  { label: "Terlama", value: "oldest" },
];

// MENU ADMIN
const forumMenu = ref(null);
const forumMenuItems = computed(() => [
  {
    label: "Hapus Topik (Admin)",
    icon: "fas fa-trash",
    class: "text-red-600 font-bold",
    command: () => confirmDeleteTopic(),
  },
]);

// --- LOAD DATA ---
const loadData = async () => {
  loading.value = true;
  try {
    // Gunakan API yang sama (Admin biasanya punya akses ke semua endpoint GET)
    const resForum = await forumApi.getForumDetail(props.slug, props.forumId);
    forum.value = resForum.data.data;
    await fetchAnswers();
  } catch (err) {
    console.error(err);
    if (err.response?.status === 404) router.replace("/admin/communities");
  } finally {
    loading.value = false;
  }
};

const fetchAnswers = async () => {
  loadingAnswers.value = true;
  try {
    const res = await forumApi.getResponds(props.slug, props.forumId, sortOption.value, currentPage.value);
    const responseData = res.data.data;

    if (responseData.data) {
      answers.value = responseData.data;
      totalRecords.value = responseData.meta.total_items;
      rowsPerPage.value = responseData.meta.per_page;
    } else {
      answers.value = responseData;
      totalRecords.value = answers.value.length;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingAnswers.value = false;
  }
};

// --- ACTIONS ---
const toggleForumMenu = (event) => forumMenu.value.toggle(event);

const confirmDeleteTopic = () => {
  confirm.require({
    message: "Tindakan Admin: Hapus topik ini beserta seluruh jawabannya?",
    header: "Konfirmasi Hapus",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Hapus",
    rejectLabel: "Batal",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      try {
        await forumApi.deleteForum(props.forumId);
        toast.add({ severity: "success", summary: "Terhapus", detail: "Topik dihapus oleh Admin." });
        router.replace(`/admin/communities/${props.slug}/forums`);
      } catch (e) {
        toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus topik." });
      }
    },
  });
};

const handleRefreshAnswers = () => {
  fetchAnswers();
};

const onPageChange = (event) => {
  currentPage.value = event.page + 1;
  fetchAnswers();
};

watch(sortOption, () => {
  currentPage.value = 1;
  fetchAnswers();
});

const getRoleColor = (role) => {
  switch (role) {
    case "Admin":
      return "bg-gray-800 text-white";
    case "Dosen":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Mahasiswa":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

onMounted(loadData);
</script>

<template>
  <LayoutAdminUser>
    <div class="w-full grow bg-gray-50 pb-20 pt-4 md:pt-0 md:mt-24 px-4 flex justify-center">
      <div class="w-full max-w-5xl flex flex-col gap-6">
        <div class="text-sm flex items-center gap-2 text-gray-500">
          <RouterLink to="/admin/home" class="hover:text-blue-600">Admin</RouterLink> / <RouterLink :to="`/admin/communities/${slug}/forums`" class="hover:text-blue-600">Forum</RouterLink> /
          <span class="text-gray-400">Detail</span>
        </div>

        <div v-if="loading" class="flex flex-col items-center py-20 gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
        </div>

        <template v-else-if="forum">
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-start">
              <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight w-full pr-4">
                {{ forum.title }}
              </h1>
              <div class="shrink-0 relative">
                <button @click="toggleForumMenu" class="text-gray-400 hover:text-gray-600 p-2 rounded-full aspect-square w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition">
                  <i class="fa-solid fa-ellipsis-vertical text-xl"></i>
                </button>
                <Menu ref="forumMenu" :model="forumMenuItems" :popup="true" />
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-b border-gray-200 pb-4">
              <div class="flex items-center gap-2">
                <img :src="forum.profile_picture_url" class="w-5 h-5 rounded-full" />
                <span class="font-medium text-gray-900">{{ forum.fullname }}</span>
                <span class="items-center px-1.5 text-[10px] font-bold border shadow-sm rounded-full" :class="getRoleColor(forum.role_name)">
                  {{ forum.role_name }}
                </span>
              </div>
              <span>•</span>
              <span>{{ formatDistanceToNow(new Date(forum.created_at), { addSuffix: true, locale: idLocale }) }}</span>
              <span>•</span>
              <span class="font-bold text-blue-600">ADMIN MODE (READ ONLY)</span>
            </div>

            <div class="flex flex-col gap-8">
              <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex gap-6">
                <div class="flex flex-col items-center gap-1 min-w-10 pt-2">
                  <span class="font-bold text-xl text-gray-700"><NumberFlow :value="forum.vote_count" /></span>
                  <span class="text-[10px] uppercase text-gray-400 font-bold">Votes</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="prose prose-blue w-full text-gray-800" v-html="forum.description"></div>
                  <div v-if="forum.media_url" class="mt-6 pt-4 border-t border-gray-100">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block"> Lampiran </span>
                    <div class="rounded-lg overflow-hidden border border-gray-200 inline-block bg-gray-50">
                      <Image :src="forum.media_url" preview imageClass="max-h-[300px] w-auto object-contain" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4">
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

                <template v-else>
                  <ForumAnswer v-for="ans in answers" :key="ans.id" :answer="ans" :isAdminView="true" :communitySlug="slug" :forumId="props.forumId" @refresh="handleRefreshAnswers" />

                  <Paginator v-if="totalRecords > rowsPerPage" :rows="rowsPerPage" :totalRecords="totalRecords" :first="(currentPage - 1) * rowsPerPage" @page="onPageChange" class="mt-4 bg-transparent! border-none!" />
                </template>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </LayoutAdminUser>
</template>
