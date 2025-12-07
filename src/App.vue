<script setup>
import { ConfirmDialog, Toast } from "primevue";
import ReportModal from "@/components/Reports/ReportModal.vue";
import { onUnmounted, provide, ref } from "vue";
import { useAuthStore } from "@/store/auth";

const authStore = useAuthStore();

onUnmounted(() => {
  authStore.stopNotificationPolling();
});

const reportModalRef = ref(null);

provide("reportModal", reportModalRef);
</script>

<template>
  <Toast />
  <ConfirmDialog></ConfirmDialog>
  <RouterView />

  <ReportModal ref="reportModalRef" />
</template>

<style scoped></style>
