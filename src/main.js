import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import router from "@/router";
import { createPinia } from "pinia";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import { Tooltip } from "primevue";

import "nprogress/nprogress.css";

const pinia = createPinia();

const app = createApp(App)
  .use(pinia)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: "none", // or false
      },
    },
  })
  .use(ConfirmationService)
  .use(ToastService)
  .directive("tooltip", Tooltip)
  .mount("#app");
