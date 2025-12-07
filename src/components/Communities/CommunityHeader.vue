<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast, useConfirm, Image, InputText, RadioButton, Button } from "primevue";
import Editor from "primevue/editor";
import { Dialog } from "primevue";
import Select from "primevue/select";
import _ from "lodash";

import communityApi from "@/services/communityApi";
import memberApi from "@/services/memberApi";

import { useReportModal } from "@/utils/useReportModal";

const { openReport } = useReportModal();

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

const emit = defineEmits(["refresh"]);

// --- STATE TRANSFER & INVITE ---
const showTransferDialog = ref(false);
const candidateSearch = ref("");
const candidateList = ref([]);
const selectedCandidate = ref(null);
const isTransferring = ref(false);

// State Undang (Invite)
const showInviteDialog = ref(false);
const inviteTab = ref("internal");
const inviteSearch = ref("");
const searchResults = ref([]); // Hasil pencarian user internal
const loadingInvite = ref(false);

// Form Invite External
const externalForm = ref({
  fullname: "",
  username: "",
  email: "",
  role: "Alumni",
  tahun_lulus: "",
  pekerjaan_saat_ini: "",
  nama_perusahaan: "",
  jabatan: "",
  alamat_perusahaan: "",
  bidang_keahlian: "",
  instansi_asal: "",
});

const roleOptions = ref([
  { label: "Alumni", value: "Alumni" },
  { label: "Mitra", value: "Mitra" },
  { label: "Pakar", value: "Pakar" },
]);

// --- STATE EDIT ---
const showEditDialog = ref(false);
const editLoading = ref(false);

const editForm = ref({
  name: "",
  about: "",
  is_public: null,
  thumbnail: null,
});
const editPreview = ref(null);

// --- COMPUTED PROPERTIES ---
const isOwner = computed(() => {
  return props.community?.current_user_role === "OWNER" && props.community?.user_membership_status === "GRANTED";
});
const isAdmin = computed(() => {
  return props.community?.current_user_role === "ADMIN" && props.community?.user_membership_status === "GRANTED";
});
const isJoined = computed(() => {
  return ["OWNER", "ADMIN", "MEMBER"].includes(props.community?.current_user_role) && props.community?.user_membership_status === "GRANTED";
});
const isPending = computed(() => {
  return props.community?.user_membership_status === "REQUEST";
});
// [BARU] Status Invited (Diundang)
const isInvited = computed(() => {
  return props.community?.user_membership_status === "INVITED";
});

const canManageCommunity = computed(() => {
  return isOwner.value || isAdmin.value;
});

// --- ACTIONS JOIN/LEAVE/RESPOND ---

// [BARU] Terima Undangan
const handleAcceptInvite = async () => {
  try {
    await communityApi.acceptInvitation(props.community.slug);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Anda telah bergabung!", life: 3000 });
    emit("refresh"); // Refresh agar tombol berubah jadi "Keluar"
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal menerima undangan", life: 3000 });
  }
};

// [BARU] Tolak Undangan
const handleDeclineInvite = () => {
  confirm.require({
    message: "Apakah Anda yakin ingin menolak undangan ini?",
    header: "Tolak Undangan",
    icon: "pi pi-info-circle",
    rejectLabel: "Batal",
    acceptLabel: "Tolak",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600 bg-transparent border border-gray-100 hover:bg-gray-100",
    accept: async () => {
      try {
        await communityApi.declineInvitation(props.community.slug);
        toast.add({ severity: "info", summary: "Ditolak", detail: "Undangan ditolak.", life: 3000 });
        emit("refresh"); // Refresh agar tombol hilang/berubah
      } catch (err) {
        toast.add({ severity: "error", summary: "Gagal", detail: "Gagal menolak undangan", life: 3000 });
      }
    },
  });
};

const handleJoinCommunity = async () => {
  try {
    await communityApi.joinCommunity(props.community.slug);
    if (props.community.is_public) {
      toast.add({ severity: "success", summary: "Berhasil", detail: "Anda telah bergabung!", life: 3000 });
    } else {
      toast.add({ severity: "info", summary: "Permintaan Terkirim", detail: "Menunggu persetujuan Admin.", life: 3000 });
    }
    emit("refresh");
  } catch (err) {
    const msg = err.response?.data?.meta?.message || "Gagal bergabung ke komunitas.";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  }
};

const handleLeaveClick = () => {
  if (isOwner.value) {
    console.log(props.community);
    if (props.community.total_members <= 1) {
      confirmDeleteCommunity();
    } else {
      showTransferDialog.value = true;
      loadCandidates();
    }
  } else {
    confirmLeaveNormal();
  }
};

const confirmLeaveNormal = () => {
  confirm.require({
    message: "Yakin ingin keluar dari komunitas?",
    header: "Konfirmasi",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => await processLeave(),
  });
};

const confirmDeleteCommunity = () => {
  confirm.require({
    message: "Anda satu-satunya anggota. Keluar berarti menghapus komunitas ini. Lanjutkan?",
    header: "Hapus Komunitas?",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    rejectClass: "text-gray-600! bg-transparent! border! border-gray-100! hover:bg-gray-100!",
    accept: async () => {
      await processLeave();
    },
  });
};

const processLeave = async () => {
  try {
    await communityApi.leaveCommunity(props.community.slug);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Anda telah keluar.", life: 3000 });
    emit("refresh");
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: err.response?.data?.meta?.message || "Gagal keluar", life: 3000 });
  }
};

// ... (Logic Transfer Ownership) ...
const loadCandidates = async () => {
  try {
    const res = await memberApi.getMembers(props.community.slug, candidateSearch.value, 1);
    const data = res.data.data;
    const allCandidates = [...(data.admins || []), ...(data.members || [])];
    candidateList.value = allCandidates.filter((u) => u.role !== "OWNER");
  } catch (err) {
    console.error(err);
  }
};
const handleCandidateSearch = _.debounce(() => {
  loadCandidates();
}, 500);
const confirmTransferAndLeave = async () => {
  if (!selectedCandidate.value) return;
  isTransferring.value = true;
  try {
    await communityApi.transferOwnership(props.community.slug, selectedCandidate.value.id);
    await communityApi.leaveCommunity(props.community.slug);
    toast.add({ severity: "success", summary: "Selesai", detail: "Kepemilikan dipindah & Anda telah keluar.", life: 3000 });
    showTransferDialog.value = false;
    emit("refresh");
  } catch (err) {
    toast.add({ severity: "error", summary: "Gagal", detail: "Gagal memproses transfer.", life: 3000 });
  } finally {
    isTransferring.value = false;
  }
};

// --- LOGIC INVITE (Internal & External) ---

// 1. Cari Kandidat Internal
const searchInternalUsers = async () => {
  if (!inviteSearch.value.trim()) {
    searchResults.value = [];
    return;
  }

  loadingInvite.value = true;
  try {
    const res = await communityApi.searchCandidates(props.community.slug, inviteSearch.value);
    searchResults.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingInvite.value = false;
  }
};

const handleInviteSearch = _.debounce(() => {
  searchInternalUsers();
}, 500);

// 2. Kirim Undangan
const handleInviteUser = async (user) => {
  try {
    await communityApi.inviteMember(props.community.slug, user.id);

    toast.add({ severity: "success", summary: "Terkirim", detail: `Undangan dikirim ke ${user.fullname}.`, life: 3000 });

    // Hapus dari list pencarian
    searchResults.value = searchResults.value.filter((u) => u.id !== user.id);
  } catch (err) {
    const msg = err.response?.data?.meta?.message || "Gagal mengundang user";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  }
};

const buildExternalFormData = () => {
  const fd = new FormData();

  // Isi field dasar
  fd.append("fullname", externalForm.value.fullname);
  fd.append("username", externalForm.value.username);
  fd.append("email", externalForm.value.email);
  fd.append("role", externalForm.value.role);

  // Kondisional berdasarkan role
  if (externalForm.value.role === "Alumni") {
    fd.append("tahun_lulus", externalForm.value.tahun_lulus || "");
    fd.append("pekerjaan_saat_ini", externalForm.value.pekerjaan_saat_ini || "");
    fd.append("nama_perusahaan", externalForm.value.nama_perusahaan || "");
  }

  if (externalForm.value.role === "Mitra") {
    fd.append("nama_perusahaan", externalForm.value.nama_perusahaan || "");
    fd.append("jabatan", externalForm.value.jabatan || "");
    fd.append("alamat_perusahaan", externalForm.value.alamat_perusahaan || "");
  }

  if (externalForm.value.role === "Pakar") {
    fd.append("bidang_keahlian", externalForm.value.bidang_keahlian || "");
    fd.append("instansi_asal", externalForm.value.instansi_asal || "");
  }

  return fd;
};

// 3. Request External
const submitExternalRequest = async () => {
  loadingInvite.value = true;
  try {
    if (!externalForm.value.fullname || !externalForm.value.email || !externalForm.value.username) {
      toast.add({ severity: "warn", summary: "Validasi", detail: "Nama, Username, dan Email wajib diisi.", life: 3000 });
      loadingInvite.value = false;
      return;
    }
    // Build FormData
    const formData = buildExternalFormData();
    await communityApi.requestExternalUser(props.community.slug, formData);
    toast.add({ severity: "success", summary: "Terkirim", detail: "Permintaan pembuatan akun telah dikirim ke Admin Sinergi.", life: 5000 });
    showInviteDialog.value = false;
    // Reset form
    externalForm.value = { fullname: "", username: "", email: "", role: "Alumni", tahun_lulus: "", pekerjaan_saat_ini: "", nama_perusahaan: "", jabatan: "", alamat_perusahaan: "", bidang_keahlian: "", instansi_asal: "" };
  } catch (err) {
    const msg = err.response?.data?.meta?.message || "Gagal mengirim permintaan.";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  } finally {
    loadingInvite.value = false;
  }
};

// --- LOGIC EDIT ---
const openEditDialog = () => {
  editForm.value = {
    name: props.community.name,
    about: props.community.about,
    is_public: props.community.is_public ? "1" : "0",
    thumbnail: null,
  };
  editPreview.value = props.community.thumbnail_url;
  showEditDialog.value = true;
};

const handleEditFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({ severity: "warn", summary: "File Besar", detail: "Maksimal 5MB", life: 3000 });
      return;
    }
    editForm.value.thumbnail = file;
    const reader = new FileReader();
    reader.onload = (e) => (editPreview.value = e.target.result);
    reader.readAsDataURL(file);
  }
};

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";
  let cleaned = htmlContent.replace(/&nbsp;/g, " ");
  return cleaned;
};

const submitEditCommunity = async () => {
  editLoading.value = true;
  try {
    const finalAbout = cleanContent(editForm.value.about);
    const formData = new FormData();
    formData.append("name", editForm.value.name);
    formData.append("about", finalAbout);
    formData.append("is_public", editForm.value.is_public);
    if (editForm.value.thumbnail) {
      formData.append("thumbnail", editForm.value.thumbnail);
    }
    const response = await communityApi.updateCommunity(props.community.slug, formData);
    toast.add({ severity: "success", summary: "Berhasil", detail: "Informasi komunitas diperbarui.", life: 3000 });
    showEditDialog.value = false;
    const newSlug = response.data.data?.slug;
    if (newSlug && newSlug !== props.community.slug) {
      router.replace(`/communities/${newSlug}`);
    } else {
      emit("refresh");
    }
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.meta?.message || "Gagal memperbarui komunitas";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  } finally {
    editLoading.value = false;
  }
};

// --- STICKY HEADER ---
const isSticky = ref(false);
const headerContentRef = ref(null);
const stickyTabsRef = ref(null);
const stickyStyles = ref({});
const placeholderHeight = ref("0px");
const navbarHeight = 72;

const handleScroll = () => {
  if (!headerContentRef.value || !stickyTabsRef.value) return;
  const headerRect = headerContentRef.value.getBoundingClientRect();
  const triggerPoint = headerRect.bottom;
  if (triggerPoint <= navbarHeight) {
    if (isSticky.value) return;
    const tabsHeight = stickyTabsRef.value.offsetHeight;
    isSticky.value = true;
    stickyStyles.value = { position: "fixed", top: `${navbarHeight}px`, left: `${headerRect.left}px`, width: `${headerRect.width}px`, zIndex: 30 };
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
  <div class="w-full bg-white shadow">
    <div ref="headerContentRef" class="w-full flex flex-col items-center gap-4">
      <div class="w-full flex flex-col gap-4 max-w-[1250px]">
        <Image :src="community.thumbnail_url" alt="" imageClass="object-cover w-full max-h-[464px] rounded-lg" preview />

        <div class="w-full px-2 md:px-8 flex flex-col gap-4">
          <span class="font-extrabold text-xl md:text-2xl xl:max-w-[60%]">{{ community.name }}</span>

          <div class="w-full flex flex-col md:flex-row items-start md:items-center gap-2 flex-wrap justify-between pb-4 border-b border-b-[#99A1AF]">
            <!-- Info Anggota & Privasi -->
            <div class="flex gap-4 items-center justify-start text-[#6A7282]">
              <span class="flex items-center justify-start gap-2">
                <i class="fa-solid text-sm" :class="community.is_public ? 'fa-earth-americas' : 'fa-lock'"></i>
                <span class="text-sm">Grup {{ community.is_public ? "Publik" : "Privat" }}</span>
              </span>
              <i class="fa-solid fa-circle text-[6px]"></i>
              <span class="flex items-center justify-start gap-2">
                <i class="fa-solid fa-user-group text-sm"></i>
                <span class="text-sm">{{ community.total_members }} anggota</span>
              </span>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="flex gap-2 items-center justify-start">
              <!-- 1. Tombol UNDANG (Admin/Owner) -->
              <button
                v-if="canManageCommunity"
                @click="showInviteDialog = true"
                type="button"
                class="flex items-center justify-center cursor-pointer gap-2 bg-blue-600 transition duration-150 hover:bg-sky-700 text-white px-4 py-2 rounded-md text-sm md:text-base"
              >
                <i class="fa-solid fa-plus"></i>
                <span>Undang</span>
              </button>

              <!-- 2. Tombol KELUAR (Jika sudah bergabung) -->
              <button v-if="isJoined" @click="handleLeaveClick" class="flex items-center justify-center cursor-pointer gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm md:text-base">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>{{ isOwner && props.community.total_members <= 1 ? "Keluar & Hapus" : "Keluar" }}</span>
              </button>

              <!-- 3. Status MENUNGGU (Request) -->
              <button v-else-if="isPending" type="button" disabled class="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-md text-sm md:text-base cursor-not-allowed">
                <i class="fa-regular fa-clock"></i>
                <span>Menunggu Persetujuan</span>
              </button>

              <!-- 4. [BARU] Status DIUNDANG (Invited) -->
              <div v-else-if="isInvited" class="flex gap-2">
                <button
                  @click="handleAcceptInvite"
                  type="button"
                  class="flex items-center justify-center cursor-pointer gap-2 bg-green-600 transition duration-150 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm md:text-base font-semibold"
                >
                  <i class="fa-solid fa-check"></i>
                  <span>Terima</span>
                </button>
                <button
                  @click="handleDeclineInvite"
                  type="button"
                  class="flex items-center justify-center cursor-pointer gap-2 bg-red-100 transition duration-150 hover:bg-red-200 text-red-600 px-4 py-2 rounded-md text-sm md:text-base font-semibold"
                >
                  <i class="fa-solid fa-xmark"></i>
                  <span>Tolak</span>
                </button>
              </div>

              <!-- 5. Tombol BERGABUNG (Visitor) -->
              <button
                v-else
                @click="handleJoinCommunity"
                type="button"
                class="flex items-center justify-center cursor-pointer gap-2 bg-blue-600 transition duration-150 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm md:text-base font-semibold"
              >
                <i class="fa-solid fa-user-plus"></i>
                <span>Bergabung</span>
              </button>

              <!-- 6. Tombol EDIT (Admin/Owner) -->
              <button
                v-if="canManageCommunity"
                @click="openEditDialog"
                class="flex items-center justify-center cursor-pointer gap-2 bg-gray-200 transition duration-150 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm md:text-base"
                title="Edit Komunitas"
              >
                <i class="fa-solid fa-pen-to-square"></i>
                <span class="hidden md:inline">Edit</span>
              </button>

              <!-- 7. Tombol LAPOR (Bukan Owner) -->
              <button
                v-if="!isOwner"
                @click="openReport('COMMUNITY', community.id)"
                class="flex items-center justify-center cursor-pointer gap-2 bg-gray-100 transition duration-150 hover:bg-red-50 text-gray-600 hover:text-red-600 px-3 py-2 rounded-md text-sm md:text-base"
                title="Laporkan Komunitas"
              >
                <i class="fa-solid fa-flag"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STICKY TABS -->
    <div class="w-full flex justify-center bg-white shadow-md z-40" ref="stickyTabsRef" :style="stickyStyles">
      <div class="w-full max-w-[1250px] px-2 md:px-8 flex items-center justify-between">
        <div class="flex items-center justify-start">
          <RouterLink
            :to="`/communities/${community.slug}`"
            class="flex items-center justify-center cursor-pointer gap-2 bg-gray-0 transition duration-150 font-bold hover:bg-gray-100 px-4 py-3 rounded-t-md text-sm border-b-4"
            :class="route.name === 'CommunityDetail' || route.name === 'CommunityPosts' ? 'border-b-blue-400 text-blue-400' : 'text-[#65686C] border-b-transparent'"
          >
            <span>Postingan</span>
          </RouterLink>
          <RouterLink
            :to="`/communities/${community.slug}/forums`"
            class="flex items-center justify-center cursor-pointer gap-2 bg-gray-0 transition duration-150 font-bold hover:bg-gray-100 px-4 py-3 rounded-t-md text-sm border-b-4"
            :class="route.name === 'CommunityForums' ? 'border-b-blue-400 text-blue-400' : 'text-[#65686C] border-b-transparent'"
          >
            <span>Forum</span>
          </RouterLink>
          <RouterLink
            :to="`/communities/${community.slug}/members`"
            class="flex items-center justify-center cursor-pointer gap-2 bg-gray-0 transition duration-150 font-bold hover:bg-gray-100 px-4 py-3 rounded-t-md text-sm border-b-4"
            :class="route.name === 'CommunityMembers' ? 'border-b-blue-400 text-blue-400' : 'text-[#65686C] border-b-transparent'"
          >
            <span>Orang</span>
          </RouterLink>
          <RouterLink
            v-if="canManageCommunity"
            :to="`/communities/${community.slug}/dashboard`"
            class="flex items-center justify-center cursor-pointer gap-2 bg-gray-0 transition duration-150 font-bold hover:bg-gray-100 px-4 py-3 rounded-t-md text-sm border-b-4"
            :class="route.name === 'CommunityDashboard' ? 'border-b-blue-400 text-blue-400' : 'text-[#65686C] border-b-transparent'"
          >
            <span>Dashboard</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <div :style="{ height: placeholderHeight }"></div>

    <!-- DIALOG EDIT -->
    <Dialog v-model:visible="showEditDialog" modal header="Edit Komunitas" class="w-2xl">
      <form @submit.prevent="submitEditCommunity" class="w-full flex flex-col gap-4 border-t py-2">
        <div class="w-full">
          <div class="flex flex-col gap-2">
            <label for="name" class="text-sm font-semibold">Nama Komunitas <span class="text-red-500">*</span></label>
            <InputText id="name" v-model="editForm.name" placeholder="Masukkan nama komunitas..." />
          </div>
        </div>
        <div class="w-full">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Jenis Privasi <span class="text-red-500">*</span></label>
            <div class="flex gap-4">
              <div class="flex flex-col lg:flex-row items-start justify-center gap-2">
                <RadioButton v-model="editForm.is_public" inputId="editPublik" name="is_public" value="1" class="blue-radio" />
                <label for="editPublik" class="flex flex-col gap-2 text-sm cursor-pointer">
                  <span class="flex gap-2 items-center font-medium"><i class="fa-solid fa-earth-americas text-sm"></i><span>Publik</span></span>
                  <p class="text-xs text-justify text-gray-600">Siapa saja bisa melihat siapa yang ada di grup dan apa yang mereka posting.</p>
                </label>
              </div>
              <div class="flex items-start justify-center gap-2 text-sm">
                <RadioButton v-model="editForm.is_public" inputId="editPrivat" name="is_public" value="0" class="blue-radio" />
                <label for="editPrivat" class="flex flex-col gap-2 text-sm cursor-pointer">
                  <span class="flex gap-2 items-center font-medium"><i class="fa-solid fa-lock text-sm"></i><span>Privat</span></span>
                  <p class="text-xs text-justify text-gray-600">Hanya anggota yang bisa melihat siapa yang ada di dalam grup.</p>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Tentang <span class="text-red-500">*</span></label>
            <Editor v-model="editForm.about" editorStyle="height: 200px">
              <template v-slot:toolbar>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                </span>
              </template>
            </Editor>
          </div>
        </div>
        <div class="w-full">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-semibold">Sampul Komunitas</label>
            <div class="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 group cursor-pointer" @click="$refs.editFileRef.click()">
              <img v-if="editPreview" :src="editPreview" class="w-full h-full object-cover" />
              <div v-else class="flex items-center justify-center w-full h-full text-gray-400"><i class="fa-regular fa-image text-3xl"></i></div>
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><i class="fa-solid fa-camera text-white text-2xl"></i></div>
            </div>
            <input type="file" ref="editFileRef" class="hidden" accept="image/*" @change="handleEditFileChange" />
          </div>
        </div>
        <div class="w-full border-t py-2 mt-2">
          <div class="flex justify-end gap-2">
            <Button type="button" label="Batal" @click="showEditDialog = false" class="p-button-text text-gray-600! hover:bg-gray-100!" />
            <Button
              type="submit"
              label="Simpan Perubahan"
              class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer transition-colors duration-300 px-6"
              :loading="editLoading"
              :disabled="!editForm.name"
            />
          </div>
        </div>
      </form>
    </Dialog>

    <!-- TRANSFER & INVITE -->
    <Dialog v-model:visible="showTransferDialog" modal header="Transfer Kepemilikan" :style="{ width: '500px' }">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-gray-600">Pilih anggota untuk menjadi Owner baru sebelum Anda keluar.</p>
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i
          ><input v-model="candidateSearch" @input="handleCandidateSearch" type="text" placeholder="Cari anggota..." class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg p-2">
          <div
            v-for="user in candidateList"
            :key="user.id"
            @click="selectedCandidate = user"
            class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border"
            :class="selectedCandidate?.id === user.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-transparent'"
          >
            <img :src="user.profile_picture || 'https://ui-avatars.com/api/?name=' + user.fullname" class="w-8 h-8 rounded-full bg-gray-200 object-cover" /><span class="font-bold text-sm text-gray-800">{{ user.fullname }}</span
            ><span v-if="user.role === 'ADMIN'" class="ml-auto text-xs font-bold text-blue-600">ADMIN</span>
          </div>
        </div>
      </div>
      <template #footer
        ><div class="flex justify-end gap-2">
          <button @click="showTransferDialog = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Batal</button
          ><button @click="confirmTransferAndLeave" :disabled="!selectedCandidate || isTransferring" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            <i v-if="isTransferring" class="fa-solid fa-circle-notch fa-spin"></i><span>Transfer & Keluar</span>
          </button>
        </div></template
      >
    </Dialog>

    <!-- DIALOG UNDANG -->
    <Dialog v-model:visible="showInviteDialog" modal header="Undang Anggota" :style="{ width: '600px' }">
      <div class="flex flex-col gap-4">
        <div class="flex p-1 bg-gray-100 rounded-lg">
          <button @click="inviteTab = 'internal'" class="flex-1 py-2 text-sm font-semibold rounded-md transition-all" :class="inviteTab === 'internal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            User Sinergi
          </button>
          <button @click="inviteTab = 'external'" class="flex-1 py-2 text-sm font-semibold rounded-md transition-all" :class="inviteTab === 'external' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            Akun Baru (Eksternal)
          </button>
        </div>

        <!-- SEARCH INTERNAL -->
        <div v-if="inviteTab === 'internal'" class="flex flex-col gap-4 min-h-[300px]">
          <div class="relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input v-model="inviteSearch" @input="handleInviteSearch" type="text" placeholder="Cari nama atau username..." class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <i v-if="loadingInvite" class="fa-solid fa-circle-notch fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"></i>
          </div>

          <!-- HASIL SEARCH -->
          <div v-if="searchResults.length > 0" class="flex flex-col gap-2 max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg p-2">
            <div v-for="user in searchResults" :key="user.id" class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition border border-transparent hover:border-gray-200">
              <div class="flex items-center gap-3">
                <img :src="user.profile_picture || `https://ui-avatars.com/api/?name=${user.fullname}&background=random`" class="w-9 h-9 rounded-full object-cover border border-gray-200" />
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-gray-800">{{ user.fullname }}</span>
                  <span class="text-xs text-gray-500">@{{ user.username }}</span>
                </div>
              </div>
              <button @click="handleInviteUser(user)" class="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md hover:bg-blue-200 transition"><i class="fa-solid fa-plus mr-1"></i> Undang</button>
            </div>
          </div>

          <!-- STATE KOSONG -->
          <div v-else class="flex flex-col items-center justify-center grow text-gray-400 text-sm mt-4 border border-dashed border-gray-200 rounded-lg p-8">
            <div v-if="loadingInvite">
              <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-blue-500"></i>
              <p>Mencari...</p>
            </div>
            <div v-else-if="inviteSearch && !loadingInvite">
              <div class="flex gap-2">
                <i class="fa-solid fa-user-slash text-2xl mb-2"></i>
                <p>Pengguna tidak ditemukan atau sudah bergabung.</p>
              </div>
            </div>
            <div v-else>
              <div class="flex gap-2">
                <i class="fa-solid fa-users-viewfinder text-2xl mb-2"></i>
                <p>Ketik nama pengguna untuk mencari.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- EXTERNAL -->
        <div v-else class="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
          <!-- Data dasar -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Nama Lengkap <span class="text-red-500">*</span></label>
              <input v-model="externalForm.fullname" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Username <span class="text-red-500">*</span></label>
              <input v-model="externalForm.username" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-gray-700">Email Aktif <span class="text-red-500">*</span></label>
            <input v-model="externalForm.email" type="email" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-bold text-gray-700">Role Pengguna <span class="text-red-500">*</span></label>
            <Select v-model="externalForm.role" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Pilih Role" class="w-full text-sm" />
          </div>

          <!-- ===== FIELD KHUSUS ALUMNI ===== -->
          <div v-if="externalForm.role === 'Alumni'" class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Tahun Lulus <span class="text-red-500">*</span></label>
              <input v-model="externalForm.tahun_lulus" type="number" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="2022" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Pekerjaan Saat Ini</label>
              <input v-model="externalForm.pekerjaan_saat_ini" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="Software Engineer" />
            </div>
            <div class="col-span-2 flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Nama Perusahaan</label>
              <input v-model="externalForm.nama_perusahaan" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="PT. Teknologi Maju" />
            </div>
          </div>

          <!-- ===== FIELD KHUSUS MITRA ===== -->
          <div v-else-if="externalForm.role === 'Mitra'" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Nama Perusahaan <span class="text-red-500">*</span></label>
              <input v-model="externalForm.nama_perusahaan" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="PT. Teknologi Maju" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Jabatan</label>
              <input v-model="externalForm.jabatan" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="HR Manager" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Alamat Perusahaan</label>
              <textarea v-model="externalForm.alamat_perusahaan" rows="2" class="border border-gray-300 p-2 rounded-lg text-sm outline-none resize-none" placeholder="Jl. Sudirman No. 45, Jakarta"></textarea>
            </div>
          </div>

          <!-- ===== FIELD KHUSUS PAKAR ===== -->
          <div v-else-if="externalForm.role === 'Pakar'" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Bidang Keahlian <span class="text-red-500">*</span></label>
              <input v-model="externalForm.bidang_keahlian" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="Machine Learning, IoT, Dll." />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-bold text-gray-700">Instansi Asal</label>
              <input v-model="externalForm.instansi_asal" type="text" class="border border-gray-300 p-2 rounded-lg text-sm outline-none" placeholder="Universitas / Perusahaan / Lab" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div v-if="inviteTab === 'internal'" class="flex justify-end gap-2"><button @click="showInviteDialog = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Selesai</button></div>
        <div v-else class="flex justify-end gap-2">
          <button @click="showInviteDialog = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold">Batal</button
          ><button @click="submitExternalRequest" :disabled="loadingInvite" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <i v-if="loadingInvite" class="fa-solid fa-circle-notch fa-spin"></i><span>Kirim Permintaan</span>
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.blue-radio {
  --p-radiobutton-checked-border-color: #3b82f6;
  --p-radiobutton-checked-background: transparent;
  --p-radiobutton-icon-checked-color: #3b82f6;
  --p-radiobutton-checked-hover-border-color: #2563eb;
  --p-radiobutton-checked-hover-background: transparent;
  --p-radiobutton-icon-checked-hover-color: #2563eb;
  --p-radiobutton-focus-ring-color: #bfdbfe;
  --p-radiobutton-focus-ring-shadow: 0 0 0 0.2rem #bfdbfe;
}
</style>
