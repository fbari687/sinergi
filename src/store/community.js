import { defineStore } from "pinia";

export const useCommunityStore = defineStore("community", {
  state: () => ({
    refreshTrigger: 0,
  }),
  actions: {
    triggerRefresh() {
      this.refreshTrigger++;
    },
  },
});
