<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/store/auth";
import { useToast } from "primevue";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import profileApi from "@/services/profileApi";

const props = defineProps({
  visible: { type: Boolean, required: true },
});

const emit = defineEmits(["update:visible", "completed"]);

const authStore = useAuthStore();
const toast = useToast();
const loading = ref(false);

const kumpulanProdi = ref([
  { name: "Teknik Informatika", code: "TI" },
  { name: "Teknik Multimedia Jaringan", code: "TMJ" },
  { name: "Teknik Multimedia Digital", code: "TMD" },
  { name: "Teknik Komputer Jaringan", code: "TKJ" },
]);

const formData = ref({
  nim: "",
  prodi: "",
  nidn: "",
  bidang_keahlian: "",
});

const userRole = computed(() => authStore.user?.role);

// Fungsi Logout jika user ingin membatalkan proses
const handleLogout = async () => {
  await authStore.handleLogout();
  // Dialog akan otomatis hilang karena user menjadi null / halaman berpindah ke login
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const form = new FormData();
    form.append("nim", formData.value.nim);
    form.append("prodi", formData.value.prodi);
    form.append("nidn", formData.value.nidn);
    form.append("bidang_keahlian", formData.value.bidang_keahlian);

    await profileApi.completeData(form);

    toast.add({ severity: "success", summary: "Berhasil", detail: "Data profil berhasil disimpan!", life: 3000 });

    if (authStore.user) {
      authStore.user.is_profile_complete = true;
    }

    emit("completed");
  } catch (err) {
    console.error(err);
    const msg = err.response?.data?.meta?.message || "Gagal menyimpan data.";
    toast.add({ severity: "error", summary: "Gagal", detail: msg, life: 3000 });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog :visible="visible" modal :closable="false" :closeOnEscape="false" header="Lengkapi Data Profil" class="w-full max-w-md mx-4" :style="{ width: '500px' }">
    <p class="text-gray-600 mb-4 text-sm">
      Halo <b>{{ authStore.user?.fullname }}</b
      >! Sebagai <b>{{ userRole }}</b
      >, Anda wajib melengkapi data berikut untuk melanjutkan.
    </p>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
      <!-- FORM KHUSUS MAHASISWA -->
      <template v-if="userRole === 'Mahasiswa'">
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">NIM</label>
          <input v-model="formData.nim" type="text" class="border p-2 border-gray-300 rounded-lg focus:ring-2 ring-blue-500 outline-none" required placeholder="Nomor Induk Mahasiswa" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">Program Studi</label>
          <Select
            v-model="formData.prodi"
            optionLabel="name"
            optionValue="name"
            placeholder="Pilih Prodi"
            :options="kumpulanProdi"
            class="w-full"
            style="--p-select-focus-border-color: #3b82f6; --p-select-focus-ring-shadow: 0 0 0 2px #3b82f6; --p-select-hover-border-color: #3b82f6"
          />
        </div>
      </template>

      <!-- FORM KHUSUS DOSEN -->
      <template v-if="userRole === 'Dosen'">
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">NIDN</label>
          <input v-model="formData.nidn" type="text" class="border border-gray-300 p-2 rounded-lg focus:ring-2 ring-blue-500 outline-none" required placeholder="Nomor Induk Dosen Nasional" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-bold text-sm text-gray-700">Bidang Keahlian</label>
          <input v-model="formData.bidang_keahlian" type="text" class="border border-gray-300 p-2 rounded-lg focus:ring-2 ring-blue-500 outline-none" required placeholder="Contoh: AI, Jaringan, dll" />
        </div>
      </template>

      <!-- FOOTER BUTTONS -->
      <div class="mt-4 flex justify-between items-center">
        <!-- Tombol Batal/Logout -->
        <button type="button" @click="handleLogout" class="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold py-2 px-4 rounded-lg transition text-sm">Batal (Logout)</button>

        <!-- Tombol Simpan -->
        <button type="submit" :disabled="loading" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
          <i v-if="loading" class="fas fa-circle-notch fa-spin"></i>
          <span>{{ loading ? "Menyimpan..." : "Simpan Data" }}</span>
        </button>
      </div>
    </form>
  </Dialog>
</template>
