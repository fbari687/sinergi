<script setup>
import { Popover, useConfirm, useToast } from "primevue";
import { ref } from "vue";

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["leaveCommunity"]);

const opPopover = ref(null);
const confirm = useConfirm();
const toast = useToast();

const togglePopover = (event) => {
  opPopover.value.toggle(event);
};

const confirm1 = () => {
  confirm.require({
    message: "Do you want to leave this community?",
    header: "Danger Zone",
    icon: "pi pi-info-circle",
    rejectLabel: "Cancel",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: () => {
      emit("leaveCommunity", props.community.id);
      toast.add({ severity: "info", summary: "Confirmed", detail: `You Leaved '${community.name}' community`, life: 3000 });
    },
  });
};
</script>

<template>
  <button type="button" @click="togglePopover($event)" class="cursor-pointer px-4 bg-gray-200 text-black transition duration-150 hover:bg-gray-300 rounded-lg">
    <i class="fa-solid fa-ellipsis"></i>
  </button>
  <Popover ref="opPopover" class="bg-transparent border-none shadow-none p-0 z-30">
    <button type="button" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100"><i class="fa-solid fa-circle-exclamation w-5 text-center text-gray-500"></i> Laporkan Komunitas</button>
    <div class="w-full h-0.5 bg-gray-200 px-4"></div>
    <button type="button" @click="confirm1()" class="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-100">
      <i class="fa-solid fa-right-from-bracket w-5 text-center text-gray-500"></i> Keluar dari komunitas
    </button>
  </Popover>
</template>

<style scoped></style>
