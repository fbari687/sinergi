<script setup></script>

<template>
  <div class="w-full flex flex-col items-center justify-center gap-4 bg-white shadow animate-pulse">
    <div class="w-full flex flex-col gap-4 max-w-[1250px]">
      <div class="object-cover w-full max-h-[464px] h-[250px] bg-gray-200 rounded-lg"></div>

      <div class="w-full px-2 md:px-8 flex flex-col gap-4">
        <div class="h-8 bg-gray-200 rounded w-3/4 max-w-lg"></div>

        <div class="w-full flex flex-col md:flex-row items-start md:items-center gap-2 flex-wrap justify-between pb-4 border-b border-b-gray-200">
          <div class="flex gap-4 items-center justify-start">
            <div class="h-4 bg-gray-300 rounded w-20"></div>
            <div class="h-1 w-1 bg-gray-300 rounded-full"></div>
            <div class="h-4 bg-gray-300 rounded w-28"></div>
          </div>

          <div class="flex gap-2 items-center justify-start">
            <div class="h-10 bg-blue-300 rounded-md w-20"></div>
            <div class="h-10 bg-gray-300 rounded-md w-20"></div>
            <div class="h-10 bg-red-300 rounded-md w-20"></div>
          </div>
        </div>

        <div class="w-full flex items-center justify-between">
          <div class="flex items-center justify-start border-b-2 border-gray-200">
            <div class="h-10 px-4 py-3 bg-gray-100 rounded-t-md w-24 border-b-4 border-b-blue-400"></div>
            <div class="h-10 px-4 py-3 hover:bg-gray-100 w-20"></div>
            <div class="h-10 px-4 py-3 hover:bg-gray-100 w-20"></div>
          </div>

          <div class="flex gap-2 items-center justify-start">
            <div class="h-10 bg-gray-300 rounded-md w-10"></div>
            <div class="h-10 bg-gray-300 rounded-md w-10"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tidak memerlukan style scoped tambahan */
</style>
