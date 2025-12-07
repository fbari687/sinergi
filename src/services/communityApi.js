import apiClient from "./axios";

export default {
  getCommunityJoinedByMe() {
    return apiClient.get("/joined/communities");
  },
  getRecommendedCommunities() {
    return apiClient.get("/communities/recommended");
  },
  getCommunityDetail(slug) {
    return apiClient.get(`/communities/${slug}`);
  },
  createCommunity(communityData) {
    return apiClient.post("/communities", communityData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // [BARU] Update komunitas (Edit)
  updateCommunity(slug, formData) {
    return apiClient.post(`/communities/${slug}/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  getMembers(slug, search = "", page = 1) {
    return apiClient.get(`/communities/${slug}/members`, {
      params: {
        q: search,
        page: page,
      },
    });
  },
  joinCommunity(slug) {
    return apiClient.post(`/join/communities/${slug}`);
  },
  leaveCommunity(slug) {
    return apiClient.post(`/leave/communities/${slug}`);
  },
  transferOwnership(slug, newOwnerId) {
    const formData = new FormData();
    formData.append("new_owner_id", newOwnerId);
    return apiClient.post(`/communities/${slug}/transfer-ownership`, formData);
  },
  searchCommunities(keyword) {
    return apiClient.get("/communities/search", {
      params: { q: keyword },
    });
  },
  requestExternalUser(slug, data) {
    return apiClient.post(`/communities/${slug}/invite-external`, data);
  },
  // --- FITUR BARU: INVITE INTERNAL ---

  // 1. Cari user kandidat
  searchCandidates(slug, keyword) {
    return apiClient.get(`/communities/${slug}/search-candidates`, {
      params: { q: keyword },
    });
  },

  // 2. Undang Member (Status INVITED)
  inviteMember(slug, userId) {
    const formData = new FormData();
    formData.append("user_id", userId);
    return apiClient.post(`/communities/${slug}/invite-internal`, formData);
  },

  // 3. Terima Undangan
  acceptInvitation(slug) {
    return apiClient.post(`/communities/${slug}/accept-invite`);
  },

  // 4. Tolak Undangan
  declineInvitation(slug) {
    return apiClient.post(`/communities/${slug}/decline-invite`);
  },
};
