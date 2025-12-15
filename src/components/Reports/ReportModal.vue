<script setup>
import { ref } from "vue";
import Dialog from "primevue/dialog";
import { useToast } from "primevue";
import reportApi from "@/services/reportApi";

const toast = useToast();

const show = ref(false);
const reason = ref("");
const violation = ref("");

let targetType = null;
let targetId = null;

// ← Dipanggil dari parent
const open = (type, id) => {
  targetType = type;
  targetId = id;
  show.value = true;
};

const closeModal = () => {
  show.value = false;
  reason.value = "";
  violation.value = "";
};

// Submit report
const submit = async () => {
  if (!violation.value) {
    toast.add({
      severity: "warn",
      summary: "Pilih pelanggaran",
      detail: "Mohon pilih jenis pelanggaran.",
      life: 3000,
    });
    return;
  }

  const form = new FormData();
  form.append("reportable_type", targetType);
  form.append("reportable_id", targetId);
  form.append("violation_type", violation.value);
  form.append("reason", reason.value);

  try {
    await reportApi.submitReport(form);

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: "Laporan Anda sudah dikirim.",
      life: 3000,
    });

    closeModal();
  } catch (err) {
    toast.add({
      severity: "error",
      summary: "Gagal",
      detail: err.response?.data?.meta?.message || "Terjadi kesalahan.",
      life: 4000,
    });
  }
};

// expose method untuk parent
defineExpose({ open });
</script>

<template>
  <Dialog v-model:visible="show" modal header="Laporkan Konten" :style="{ width: '450px' }">
    <div class="flex flex-col gap-4">
      <!-- Jenis Pelanggaran -->
      <div>
        <label class="text-sm font-semibold text-gray-700">Jenis Pelanggaran</label>
        <select v-model="violation" class="w-full p-2 border rounded-lg bg-white text-sm">
          <option value="" disabled>Pilih jenis pelanggaran</option>
          <option value="SPAM">Spam / Iklan</option>
          <option value="SARA">SARA / Kebencian</option>
          <option value="PORNOGRAFI">Konten Pornografi</option>
          <option value="BULLYING">Perundungan / Pelecehan</option>
          <option value="KEKERASAN">Kekerasan / Ancaman</option>
          <option value="LAINNYA">Lainnya</option>
        </select>
      </div>

      <!-- Alasan -->
      <div>
        <label class="text-sm font-semibold text-gray-700">Alasan / Detail</label>
        <textarea v-model="reason" rows="3" class="w-full p-2 border rounded-lg text-sm" placeholder="Jelaskan alasan Anda melaporkan konten ini..."></textarea>
      </div>

      <!-- Tombol -->
      <div class="flex justify-end gap-2 mt-3">
        <button class="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer" @click="closeModal">Batal</button>
        <button class="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer" @click="submit">Laporkan</button>
      </div>
    </div>
  </Dialog>
</template>

<style scoped></style>
