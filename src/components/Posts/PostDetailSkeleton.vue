<script setup>
import Skeleton from "primevue/skeleton";
import CommentTileSkeleton from "@/components/Comments/CommentTileSkeleton.vue";
</script>

<template>
  <div class="flex flex-col h-full bg-white p-skeleton">
    <div class="flex-1 p-4 space-y-6 overflow-y-auto bg-white">
      <div>
        <div class="flex items-start">
          <Skeleton shape="circle" size="3rem" class="mr-3" />
          <div class="grow pt-1">
            <Skeleton width="40%" height="1rem" class="mb-2" />
            <Skeleton width="25%" height="0.75rem" />
          </div>
          <Skeleton width="1.5rem" height="1.5rem" />
        </div>
        <div class="pt-2 text-sm leading-relaxed mt-4 space-y-3">
          <Skeleton height="1rem" />
          <Skeleton height="1rem" />
          <Skeleton height="1rem" width="70%" />
          <Skeleton width="100%" height="300px" class="mt-3 rounded-lg" />
        </div>
        <div class="flex justify-around px-4 py-3 border-t border-b mt-4">
          <Skeleton width="4rem" height="1.5rem" />
          <Skeleton width="4rem" height="1.5rem" />
          <Skeleton width="2rem" height="1.5rem" />
        </div>
      </div>

      <div class="space-y-4">
        <h5 class="text-base font-semibold text-gray-800">
          <Skeleton width="30%" height="1.25rem" />
        </h5>
        <CommentTileSkeleton />
        <CommentTileSkeleton />
        <CommentTileSkeleton />
      </div>
    </div>

    <div class="shrink-0 p-4 border-t bg-white">
      <div class="flex items-center justify-between gap-3"><Skeleton shape="circle" size="2.5rem" /> <Skeleton height="2.75rem" class="flex-1 rounded-full" /> <Skeleton width="4.5rem" height="2.75rem" class="rounded-full" /></div>
    </div>
  </div>
</template>

<style scoped>
.p-skeleton::before {
  content: "";
  /* Style shimmer lainnya ditangani oleh PrimeVue */
}
</style>
