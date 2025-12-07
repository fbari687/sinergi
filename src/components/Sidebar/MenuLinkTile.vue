<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  isNotification: {
    type: Boolean,
    required: false,
  },
  countNotification: {
    type: Number,
    required: false,
  },
});
</script>

<template>
  <RouterLink
    :to="to"
    active-class="text-blue-600!"
    class="w-12 h-12 md:w-auto md:h-auto flex flex-col justify-center md:justify-start md:flex-row text-black gap-2 md:gap-4 items-center md:px-5 md:py-3.5 md:mb-2.5 font-medium text-xs md:text-base transition-colors duration-200 hover:bg-gray-100"
  >
    <template v-if="icon">
      <i :class="'w-6 text-xl relative ' + icon">
        <template v-if="isNotification">
          <div v-if="countNotification > 0" class="absolute -top-2 right-0 bg-red-500 text-white text-[8px] flex items-center justify-center w-4 h-4 rounded-full">{{ countNotification }}</div>
        </template>
      </i>
    </template>
    <img v-if="image" :src="image" class="w-6 h-6 rounded-full cursor-pointer object-cover border-2 border-gray-200" alt="Foto User" />
    <span v-if="label">{{ label }}</span>
  </RouterLink>
</template>

<style scoped></style>
