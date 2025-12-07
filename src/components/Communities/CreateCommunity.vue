<script setup>
import communityApi from "@/services/communityApi";
import { Button, Dialog, FileUpload, InputText, Message, RadioButton } from "primevue";
import Editor from "primevue/editor";
import { ref } from "vue";
import { useToast } from "primevue";
import { useCommunityStore } from "@/store/community";

const toast = useToast();
const communityStore = useCommunityStore();

const visible = ref(false);
const name = ref("");
const isPublic = ref(null);
const src = ref(null);
const fileUpload = ref(null);
const about = ref("");
const loading = ref(false);
const error = ref(null);
const submitted = ref(false);

const cleanContent = (htmlContent) => {
  if (!htmlContent) return "";

  let cleaned = htmlContent.replace(/&nbsp;/g, " ");

  return cleaned;
};

const handleSubmit = async () => {
  submitted.value = true; // Tandai bahwa tombol submit sudah ditekan

  // --- VALIDASI MANUAL ---
  // 1. Cek Nama
  if (!name.value.trim()) {
    showError("Nama komunitas wajib diisi");
    return;
  }
  // 2. Cek Privasi (Harus dipilih salah satu)
  if (isPublic.value === null || isPublic.value === undefined) {
    showError("Jenis privasi wajib dipilih");
    return;
  }
  // 3. Cek Tentang (Editor tidak boleh kosong atau cuma tag <p><br></p>)
  if (!about.value || about.value === "<p><br></p>") {
    showError("Deskripsi tentang komunitas wajib diisi");
    return;
  }
  // 4. Cek Thumbnail (File wajib ada)
  if (!fileUpload.value) {
    showError("Thumbnail komunitas wajib diupload");
    return;
  }

  // --- JIKA LOLOS SEMUA VALIDASI ---
  loading.value = true;
  error.value = null;

  try {
    const finalAbout = cleanContent(about.value);
    const formData = new FormData();
    formData.append("name", name.value);
    formData.append("thumbnail", fileUpload.value);
    formData.append("is_public", isPublic.value);
    formData.append("about", finalAbout);

    await communityApi.createCommunity(formData);

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: "Komunitas berhasil dibuat!",
      life: 3000,
    });

    // Reset Form
    resetForm();
    visible.value = false;
    communityStore.triggerRefresh();
  } catch (err) {
    const errorMessage = err.response?.data?.meta?.message || "Gagal membuat komunitas";
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

const showError = (msg) => {
  toast.add({ severity: "warn", summary: "Peringatan", detail: msg, life: 3000 });
};

const resetForm = () => {
  name.value = "";
  isPublic.value = null;
  src.value = null;
  fileUpload.value = null;
  about.value = "";
  submitted.value = false;
};

function onFileSelect(event) {
  const file = event.files[0];
  const reader = new FileReader();

  fileUpload.value = file;

  reader.onload = async (e) => {
    src.value = e.target.result;
  };

  reader.readAsDataURL(file);
}
</script>

<template>
  <button @click="visible = true" type="button" class="cursor-pointer px-3 py-2 bg-[#EBF5FF] w-full font-bold text-sm text-[#0164D1] rounded-lg transition duration-150 text-center flex gap-2 items-center justify-center hover:bg-sky-100">
    <i class="fa-solid fa-plus"></i>Buat Komunitas
  </button>

  <Dialog v-model:visible="visible" modal header="Buat Komunitas" class="w-2xl">
    <form @submit.prevent="handleSubmit" class="w-full flex flex-col gap-4 border-t py-2">
      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm font-semibold">Nama Komunitas <span class="text-red-500">*</span></label>
          <InputText id="name" v-model="name" :class="{ 'p-invalid': submitted && !name }" placeholder="Masukkan nama komunitas..." />
          <small v-if="submitted && !name" class="text-red-500">Nama komunitas wajib diisi.</small>
        </div>
      </div>

      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold">Jenis Privasi <span class="text-red-500">*</span></label>
          <div class="flex gap-4" :class="{ 'border border-red-500 p-2 rounded': submitted && isPublic === null }">
            <div class="flex flex-col lg:flex-row items-start justify-center gap-2">
              <RadioButton v-model="isPublic" inputId="publik" name="publik" value="1" class="blue-radio" />
              <label for="publik" class="flex flex-col gap-2 text-sm cursor-pointer">
                <span class="flex gap-2 items-center font-medium">
                  <i class="fa-solid fa-earth-americas text-sm"></i>
                  <span>Publik</span>
                </span>
                <p class="text-xs text-justify text-gray-600">Siapa saja bisa melihat siapa yang ada di grup dan apa yang mereka posting. Anda bisa mengubah grup menjadi privat sekarang atau nanti.</p>
              </label>
            </div>

            <div class="flex items-start justify-center gap-2 text-sm">
              <RadioButton v-model="isPublic" inputId="privat" name="privat" value="0" class="blue-radio" />
              <label for="privat" class="flex flex-col gap-2 text-sm cursor-pointer">
                <span class="flex gap-2 items-center font-medium">
                  <i class="fa-solid fa-lock text-sm"></i>
                  <span>Privat</span>
                </span>
                <p class="text-xs text-justify text-gray-600">Hanya anggota yang bisa melihat siapa yang ada di dalam grup dan apa yang mereka posting. Anda mungkin bisa mengubah grup ini menjadi publik nanti.</p>
              </label>
            </div>
          </div>
          <small v-if="submitted && isPublic === null" class="text-red-500">Pilih salah satu jenis privasi.</small>
        </div>
      </div>

      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="about" class="text-sm font-semibold">Tentang <span class="text-red-500">*</span></label>
          <div :class="{ 'border border-red-500 rounded': submitted && (!about || about === '<p><br></p>') }">
            <Editor v-model="about" editorStyle="height: 200px">
              <template v-slot:toolbar>
                <span class="ql-formats">
                  <button class="ql-bold"></button>
                  <button class="ql-italic"></button>
                  <button class="ql-underline"></button>
                </span>
              </template>
            </Editor>
          </div>
          <small v-if="submitted && (!about || about === '<p><br></p>')" class="text-red-500">Deskripsi tentang komunitas wajib diisi.</small>
        </div>
      </div>

      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="thumbnail" class="text-sm font-semibold">Thumbnail <span class="text-red-500">*</span></label>

          <div :class="{ 'border border-red-500 rounded p-1': submitted && !fileUpload }">
            <FileUpload
              mode="basic"
              name="thumbnail"
              @select="onFileSelect"
              customUpload
              auto
              severity="secondary"
              accept="image/*"
              chooseLabel="Pilih Gambar"
              class="border-gray-400! text-gray-400! hover:bg-gray-200! p-button-outlined w-full"
            />
          </div>

          <small v-if="submitted && !fileUpload" class="text-red-500">Thumbnail wajib diupload.</small>

          <Message size="small" severity="secondary" variant="simple">Disaranakan (1250px x 464px) & Max 5mb.</Message>
          <img v-if="src" :src="src" alt="Image" class="shadow-md rounded-xl object-cover h-[229px] mt-2" />
        </div>
      </div>

      <div class="w-full border-t py-2 mt-2">
        <div class="flex justify-end gap-2">
          <Button type="button" label="Batal" @click="visible = false" class="p-button-text text-gray-600! hover:bg-gray-100!" />
          <Button type="submit" label="Buat" class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer transition-colors duration-300 px-6" :loading="loading" />
        </div>
      </div>
    </form>
  </Dialog>
  <!-- <Dialog v-model:visible="visible" modal header="Buat Komunitas" class="w-2xl">
    <form @submit.prevent="handleSubmit" class="w-full flex flex-col gap-4 border-t py-2">
      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm">Nama Komunitas</label>
          <InputText id="name" v-model="name" :class="{ 'p-invalid': submitted && !name }" 
            placeholder="Masukkan nama komunitas..." />
		  <small v-if="submitted && !name" class="text-red-500">Nama komunitas wajib diisi.</small>
        </div>
      </div>
      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="name" class="text-sm">Jenis Privasi</label>
          <div class="flex gap-4">
            <div class="flex flex-col lg:flex-row items-start justify-center gap-2">
              <RadioButton v-model="isPublic" inputId="publik" name="publik" value="1" class="blue-radio" />
              <label for="publik" class="flex flex-col gap-2 text-sm">
                <span class="flex gap-2 items-center">
                  <i class="fa-solid fa-earth-americas text-sm"></i>
                  <span>Publik</span>
                </span>
                <p class="text-xs text-justify">Siapa saja bisa melihat siapa yang ada di grup dan apa yang mereka posting. Anda bisa mengubah grup menjadi privat sekarang atau nanti.</p>
              </label>
            </div>
            <div class="flex items-start justify-center gap-2 text-sm">
              <RadioButton v-model="isPublic" inputId="privat" name="privat" value="0" class="blue-radio" />
              <label for="privat" class="flex flex-col gap-2 text-sm">
                <span class="flex gap-2 items-center">
                  <i class="fa-solid fa-lock text-sm"></i>
                  <span>Privat</span>
                </span>
                <p class="text-xs text-justify">Hanya anggota yang bisa melihat siapa yang ada di dalam grup dan apa yang mereka posting. Anda mungkin bisa mengubah grup ini menjadi publik nanti.</p>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="about" class="text-sm">Tentang</label>
          <Editor v-model="about" editorStyle="height: 320px">
            <template v-slot:toolbar>
              <span class="ql-formats">
                <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
              </span>
            </template>
          </Editor>
        </div>
      </div>
      <div class="w-full">
        <div class="flex flex-col gap-2">
          <label for="thumbnail" class="text-sm">Thumbnail</label>
          <FileUpload mode="basic" name="thumbnail" @select="onFileSelect" customUpload auto severity="secondary" accept="image/*" class="border-gray-400! text-gray-400! hover:bg-gray-200! p-button-outlined" />
          <Message size="small" severity="secondary" variant="simple">Disaranakan (1250px x 464px) & Max 5mb.</Message>
          <img v-if="src" :src="src" alt="Image" class="shadow-md rounded-xl object-cover h-[229px]" />
        </div>
      </div>
      <div class="w-full border-t py-2">
        <div class="flex justify-end gap-2">
          <Button type="submit" label="Buat" class="bg-blue-600! hover:bg-blue-700! text-white border-none h-11 rounded-lg text-base font-semibold cursor-pointer mb-6 transition-colors duration-300" :loading="loading" />
        </div>
      </div>
    </form>
  </Dialog> -->
</template>

<style scoped>
/* Kita menimpa Design Tokens khusus untuk class .blue-radio 
  Warna Biru Tailwind:
  - Blue-500: #3B82F6
  - Blue-600: #2563EB (Hover)
  - Blue-200: #BFDBFE (Focus Ring)
*/

.blue-radio {
  /* 1. Warna BORDER (Lingkaran Luar) saat Checked */
  --p-radiobutton-checked-border-color: #3b82f6;

  /* 2. Warna BACKGROUND saat Checked 
     PENTING: Set transparent agar tetap bolong (style outline) 
     sehingga icon (titik) terlihat terpisah.
  */
  --p-radiobutton-checked-background: transparent;

  /* 3. Warna ICON (Titik di tengah) saat Checked */
  --p-radiobutton-icon-checked-color: #3b82f6;

  /* --- HOVER STATE (Saat mouse di atasnya) --- */
  --p-radiobutton-checked-hover-border-color: #2563eb;
  --p-radiobutton-checked-hover-background: transparent;
  --p-radiobutton-icon-checked-hover-color: #2563eb;

  /* --- FOCUS RING (Bayangan saat diklik/tab) --- */
  --p-radiobutton-focus-ring-color: #bfdbfe;
  --p-radiobutton-focus-ring-shadow: 0 0 0 0.2rem #bfdbfe;
}
</style>
