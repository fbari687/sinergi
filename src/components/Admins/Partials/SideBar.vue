<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <aside
    class="fixed bottom-0 left-0 right-0 w-full h-16 bg-white border-t border-gray-200 p-0 z-50 overflow-y-hidden md:fixed md:top-[74px] md:left-0 md:w-[320px] md:h-[calc(100vh-74px)] md:right-auto md:bg-linear-to-b md:from-sky-500 md:to-cyan-400 md:p-4 md:z-30 md:overflow-y-auto md:border-t-0"
  >
    <div>
      <nav>
        <ul class="flex flex-row justify-around items-center md:flex-col md:block md:p-0 md:m-0 space-y-0 md:space-y-2">
          <!-- Menu Items -->
          <li
            v-for="(item, index) in [
              { name: 'Dashboard', icon: 'fa-home', link: '/admin/dashboard' },
              { name: 'Pengguna', icon: 'fa-users', link: '/admin/users' },
              { name: 'Permintaan Akun', icon: 'fa-user-plus', link: '/admin/accounts' },
              { name: 'Kelola Home', icon: 'fa-house-user', link: '/admin/home' },
              { name: 'Kelola Komunitas', icon: 'fa-user-group', link: '/admin/communities' },
              { name: 'Laporan', icon: 'fa-flag', link: '/admin/reports' },
            ]"
            :key="index"
            class="order-1 md:order-0"
          >
            <RouterLink
              :to="item.link"
              class="flex flex-col items-center justify-center p-2 text-xs font-semibold md:block md:items-center md:px-5 md:py-3.5 md:rounded-full md:font-medium md:text-lg md:transition-colors md:duration-200"
              :class="route.path == `${item.link}` ? 'text-blue-600 bg-blue-50 md:bg-white md:text-blue-600 md:shadow-sm' : 'text-gray-600 md:text-white hover:bg-gray-50 md:hover:bg-white/20 md:hover:text-white'"
            >
              <i class="fas text-xl mb-1 md:mb-0 md:w-6 md:mr-4 md:text-xl" :class="item.icon"></i>
              <span class="text-center sm:text-start">{{ item.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>
