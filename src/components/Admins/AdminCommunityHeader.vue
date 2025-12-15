<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast, useConfirm } from "primevue";
import Image from "primevue/image";
import communityApi from "@/services/communityApi";

const toast = useToast();
const confirm = useConfirm();
const route = useRoute();
const router = useRouter();

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});

// --- ACTION: HAPUS KOMUNITAS ---
const confirmDeleteCommunity = () => {
  confirm.require({
    message: `PERINGATAN: Tindakan ini akan menghapus komunitas "${props.community.name}" beserta seluruh postingan, forum, dan data anggotanya secara permanen. Lanjutkan?`,
    header: "Hapus Komunitas",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Ya, Hapus Permanen",
    rejectLabel: "Batal",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      try {
        await communityApi.deleteCommunity(props.community.slug);
        toast.add({ severity: "success", summary: "Terhapus", detail: "Komunitas berhasil dihapus.", life: 3000 });

        // Redirect kembali ke daftar komunitas admin
        router.replace("/admin/communities");
      } catch (err) {
        console.error(err);
        toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menghapus komunitas.", life: 3000 });
      }
    },
  });
};

// --- STICKY HEADER LOGIC (Sama seperti User) ---
const isSticky = ref(false);
const headerContentRef = ref(null);
const stickyTabsRef = ref(null);
const stickyStyles = ref({});
const placeholderHeight = ref("0px");
// Sesuaikan navbarHeight dengan tinggi navbar Admin Anda (biasanya LayoutAdminUser header)
const navbarHeight = 0; // Set 0 jika Admin tidak punya fixed navbar yang menimpa, atau sesuaikan pixelnya

const handleScroll = () => {
  if (!headerContentRef.value || !stickyTabsRef.value) return;

  const headerRect = headerContentRef.value.getBoundingClientRect();
  const triggerPoint = headerRect.bottom;

  if (triggerPoint <= navbarHeight) {
    if (isSticky.value) return;
    const tabsHeight = stickyTabsRef.value.offsetHeight;
    isSticky.value = true;
    // Fix ke top viewport
    stickyStyles.value = {
      position: "fixed",
      top: `${navbarHeight}px`,
      left: `${headerRect.left}px`,
      width: `${headerRect.width}px`,
      zIndex: 30,
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    };
    placeholderHeight.value = `${tabsHeight}px`;
  } else {
    if (!isSticky.value) return;
    isSticky.value = false;
    stickyStyles.value = {};
    placeholderHeight.value = "0px";
  }
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div class="w-full bg-white shadow rounded-xl overflow-hidden mb-6">
    <div ref="headerContentRef" class="w-full flex flex-col items-center gap-4">
      <div class="w-full flex flex-col gap-4">
        <Image :src="community.thumbnail_url" alt="Sampul Komunitas" imageClass="object-cover w-full max-h-[350px]" preview />

        <div class="w-full px-4 md:px-8 flex flex-col gap-4">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <span class="font-extrabold text-2xl text-gray-900">{{ community.name }}</span>

            <button @click="confirmDeleteCommunity" class="flex items-center justify-center cursor-pointer gap-2 bg-red-600 transition duration-150 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
              <i class="fa-regular fa-trash-can"></i>
              <span>Hapus Komunitas</span>
            </button>
          </div>

          <div class="w-full flex flex-col md:flex-row items-start md:items-center gap-2 flex-wrap justify-between pb-4 border-b border-b-gray-200">
            <div class="flex gap-4 items-center justify-start text-gray-500">
              <span class="flex items-center justify-start gap-2">
                <i class="fa-solid text-sm" :class="community.is_public ? 'fa-earth-americas' : 'fa-lock'"></i>
                <span class="text-sm font-medium">Grup {{ community.is_public ? "Publik" : "Privat" }}</span>
              </span>
              <i class="fa-solid fa-circle text-[6px] text-gray-300"></i>
              <span class="flex items-center justify-start gap-2">
                <i class="fa-solid fa-user-group text-sm"></i>
                <span class="text-sm font-medium">{{ community.total_members }} anggota</span>
              </span>
            </div>

            <div class="text-xs text-gray-400 font-mono">Admin Mode: Full Access</div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex justify-center bg-white z-40 border-t border-gray-100" ref="stickyTabsRef" :style="stickyStyles">
      <div class="w-full px-4 md:px-8 flex items-center justify-start overflow-x-auto">
        <div class="flex items-center justify-start">
          <RouterLink
            :to="`/admin/communities/${community.slug}`"
            class="flex items-center justify-center cursor-pointer gap-2 transition duration-150 font-bold hover:bg-gray-50 px-6 py-4 text-sm border-b-2"
            :class="route.name === 'AdminCommunityPosts' ? 'border-b-blue-600 text-blue-600' : 'text-gray-500 border-b-transparent hover:text-gray-700'"
          >
            <span>Postingan</span>
          </RouterLink>

          <RouterLink
            :to="`/admin/communities/${community.slug}/forums`"
            class="flex items-center justify-center cursor-pointer gap-2 transition duration-150 font-bold hover:bg-gray-50 px-6 py-4 text-sm border-b-2"
            :class="route.name === 'AdminCommunityForums' ? 'border-b-blue-600 text-blue-600' : 'text-gray-500 border-b-transparent hover:text-gray-700'"
          >
            <span>Forum</span>
          </RouterLink>

          <RouterLink
            :to="`/admin/communities/${community.slug}/members`"
            class="flex items-center justify-center cursor-pointer gap-2 transition duration-150 font-bold hover:bg-gray-50 px-6 py-4 text-sm border-b-2"
            :class="route.name === 'AdminCommunityMembers' ? 'border-b-blue-600 text-blue-600' : 'text-gray-500 border-b-transparent hover:text-gray-700'"
          >
            <span>Anggota</span>
          </RouterLink>

          <RouterLink
            :to="`/admin/communities/${community.slug}/dashboard`"
            class="flex items-center justify-center cursor-pointer gap-2 transition duration-150 font-bold hover:bg-gray-50 px-6 py-4 text-sm border-b-2"
            :class="route.name === 'AdminCommunityDashboard' ? 'border-b-blue-600 text-blue-600' : 'text-gray-500 border-b-transparent hover:text-gray-700'"
          >
            <span>Analitik</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>

  <div :style="{ height: placeholderHeight }"></div>
</template>
