<script setup>
import MenuLinkTile from "../Sidebar/MenuLinkTile.vue";
import CreateCommunity from "./CreateCommunity.vue";
</script>

<template>
  <div class="w-full h-2 bg-white border border-gray-200"></div>
  <div class="w-full">
    <span class="font-bold text-lg">Komunitas</span>
  </div>
  <div class="px-4 py-2 bg-white rounded-lg border border-gray-200">
    <nav>
      <ul class="list-none p-0 m-0">
        <li>
          <MenuLinkTile to="/communities" icon="fa-solid fa-house-user" label="Beranda Komunitas" />
          <!-- <MenuLinkTile to="/communities/feeds" icon="fa-solid fa-compass" label="Konten Komunitas" /> -->
          <MenuLinkTile to="/communities/joined" icon="fa-solid fa-user-group" label="Komunitas Anda" />
          <CreateCommunity />
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped></style>
