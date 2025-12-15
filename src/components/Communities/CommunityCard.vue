<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  community: {
    type: Object,
    required: true,
  },
  isJoined: {
    type: Boolean,
    required: true,
  },
  isAdminView: { type: Boolean, default: false },
});
</script>

<template>
  <div class="p-4 flex flex-col gap-3 bg-white rounded-xl">
    <div class="w-full flex gap-4">
      <img :src="community.thumbnail_url" alt="Community image" class="w-20 h-20 rounded-lg object-cover" />
      <div class="flex flex-col gap-1">
        <RouterLink :to="isAdminView ? `/admin/communities/${community.slug}` : `/communities/${community.slug}`" class="font-bold text-base line-clamp-2 cursor-pointer transition duration-150 hover:underline">{{
          community.name
        }}</RouterLink>
        <div class="flex flex-row gap-4 items-center justify-start">
          <h5 class="text-xs text-gray-600 flex items-center justify-start gap-2">
            <i class="fa-solid fa-user-group"></i><span>{{ community.total_members }} Anggota</span>
          </h5>
          <h5 class="text-xs text-gray-600 flex items-center justify-start gap-2">
            <i class="fa-solid text-sm" :class="community.is_public ? 'fa-earth-americas' : 'fa-lock'"></i><span>Grup {{ community.is_public ? "Publik" : "Privat" }}</span>
          </h5>
        </div>
      </div>
    </div>
    <div class="w-full flex gap-2">
      <template v-if="isJoined">
        <RouterLink :to="'/communities/' + community.slug" class="cursor-pointer px-3 py-2 bg-[#EBF5FF] grow font-bold text-sm text-[#0164D1] rounded-lg transition duration-150 text-center hover:bg-sky-100">Lihat Komunitas</RouterLink>
        <!-- <CommunityCardPopover :community="community" /> -->
      </template>
      <template v-else>
        <RouterLink
          :to="isAdminView ? `/admin/communities/${community.slug}` : `/communities/${community.slug}`"
          class="cursor-pointer px-3 py-2 bg-[#0164D1] grow font-bold text-sm text-[#EBF5FF] rounded-lg transition duration-150 text-center flex items-center justify-center gap-2 hover:bg-[#005dc0]"
        >
          <i class="fa-solid text-sm" :class="props.isAdminView ? 'fa-eye' : 'fa-user-plus'"></i>
          <span>{{ props.isAdminView ? "Tinjau" : "Bergabung" }}</span>
        </RouterLink>
      </template>
    </div>
  </div>
</template>
