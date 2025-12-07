import { inject } from "vue";

export function useReportModal() {
  const reportModalRef = inject("reportModal", null);

  if (!reportModalRef) {
    console.warn("[useReportModal] reportModal belum di-provide. Pastikan App.vue sudah memanggil provide('reportModal', ...).");
  }

  const openReport = (type, id) => {
    if (!reportModalRef?.value) return;
    reportModalRef.value.open(type, id);
  };

  return { openReport };
}
