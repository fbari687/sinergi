<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <RouterLink :to="'/communities/' + community.slug" class="p-2 m-0 flex flex-col gap-4 transition-colors duration-200 hover:bg-gray-100">
    <div class="flex items-center">
      <img :src="community.thumbnail_url" alt="Icon" class="w-10 h-10 rounded-lg mr-3 object-cover bg-gray-100" />
      <div class="grow">
        <h5 class="text-sm font-medium m-0 line-clamp-2">{{ community.name }}</h5>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped></style>
