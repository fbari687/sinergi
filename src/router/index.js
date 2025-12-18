import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/store/auth.js";
import NProgress from "nprogress";
import HomePage from "@/views/HomePage.vue";
import LoginPage from "@/views/LoginPage.vue";
import RegisterPage from "@/views/RegisterPage.vue";
import PostDetailPage from "@/views/PostDetailPage.vue";
import YourCommunityPage from "@/views/YourCommunityPage.vue";
import CommunityPostsPage from "@/views/CommunityPostsPage.vue";
import CommunitiesPage from "@/views/CommunitiesPage.vue";
import ForbiddenPage from "@/views/ForbiddenPage.vue";
import CommunityMembersPage from "@/views/CommunityMembersPage.vue";
import CommunityForumsPage from "@/views/CommunityForumsPage.vue";
import CommunityWrapper from "@/views/CommunityWrapper.vue";
import ForumDetail from "@/components/Forums/ForumDetail.vue";
import DashboardPage from "@/views/Admins/DashboardPage.vue";
import ManageUsersPage from "@/views/Admins/ManageUsersPage.vue";
import ManageReportsPage from "@/views/Admins/ManageReportsPage.vue";
import ProfilePage from "@/views/ProfilePage.vue";
import ManageAccountRequestPage from "@/views/Admins/ManageAccountRequestPage.vue";
import NotificationPage from "@/views/NotificationPage.vue";
import ActivateAccountPage from "@/views/Auth/ActivateAccountPage.vue";
import LandingPage from "@/views/LandingPage.vue";
import CommunityDashboardPage from "@/views/CommunityDashboardPage.vue";
import ForgotPasswordPage from "@/views/ForgotPasswordPage.vue";
import AdminHomePage from "@/views/Admins/AdminHomePage.vue";
import AdminCommunitiesPage from "@/views/Admins/AdminCommunitiesPage.vue";
import AdminCommunityWrapper from "@/views/Admins/AdminCommunityWrapper.vue";
import AdminCommunityPosts from "@/views/Admins/AdminCommunityPosts.vue";
import AdminCommunityForums from "@/views/Admins/AdminCommunityForums.vue";
import AdminCommunityMembers from "@/views/Admins/AdminCommunityMembers.vue";
import AdminForumDetail from "@/views/Admins/AdminForumDetail.vue";
import CommunityLeaderboardPage from "@/views/CommunityLeaderboardPage.vue";
import AdminLeaderboardPage from "@/views/Admins/AdminLeaderboardPage.vue";
import AccountStatusPage from "@/views/AccountStatusPage.vue";
import LeaderboardPage from "@/views/LeaderboardPage.vue";

const allRoles = ["Admin", "Dosen", "Mahasiswa", "Alumni", "Mitra", "Pakar"];
const internalRoles = ["Dosen", "Mahasiswa"];
const externalRoles = ["Alumni", "Mitra", "Pakar"];

const routes = [
  {
    path: "/403",
    name: "ForbiddenPage",
    component: ForbiddenPage,
  },
  {
    path: "/",
    name: "LandingPage",
    component: LandingPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/home",
    name: "HomePage",
    component: HomePage,
    meta: {
      roles: internalRoles,
    },
  },
  {
    path: "/login",
    name: "LoginPage",
    component: LoginPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/account-status",
    name: "AccountStatus",
    component: AccountStatusPage,
    meta: {
      roles: ["Mahasiswa"],
    }, // Pastikan user harus login dulu (token ada)
  },
  {
    path: "/register",
    name: "RegisterPage",
    component: RegisterPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/forgotpassword",
    name: "ForgotPasswordPage",
    component: ForgotPasswordPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/post/:id",
    name: "PostDetail",
    component: PostDetailPage,
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/notifications",
    name: "NotificationPage",
    component: NotificationPage,
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/communities",
    name: "Communities",
    component: CommunitiesPage,
    meta: {
      roles: internalRoles,
    },
  },
  {
    path: "/communities/joined",
    name: "YourCommunities",
    component: YourCommunityPage,
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/communities/:slug",
    component: CommunityWrapper,
    children: [
      {
        path: "",
        name: "CommunityPosts",
        component: CommunityPostsPage,
      },
      {
        path: "forums",
        name: "CommunityForums",
        component: CommunityForumsPage,
      },
      {
        path: "members",
        name: "CommunityMembers",
        component: CommunityMembersPage,
      },
      {
        path: "dashboard",
        name: "CommunityDashboard",
        component: CommunityDashboardPage,
      },
      {
        path: "leaderboard",
        name: "CommunityLeaderboard",
        component: CommunityLeaderboardPage,
      },
    ],
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/communities/:slug/forums/:forumId",
    name: "ForumDetail",
    component: ForumDetail,
    props: true, // Agar slug dan forumId masuk sebagai props
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/leaderboard",
    name: "Leaderboard",
    component: LeaderboardPage,
    meta: {
      roles: ["Dosen"],
    },
  },
  {
    path: "/profile/:username",
    name: "Profile",
    component: ProfilePage,
    meta: {
      roles: allRoles,
    },
  },
  {
    path: "/activate-account",
    name: "activate-account",
    component: ActivateAccountPage,
    meta: { publicOnly: true },
  },
  {
    path: "/admin/dashboard",
    name: "AdminDashboard",
    component: DashboardPage,
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/leaderboard",
    name: "AdminLeaderboard",
    component: AdminLeaderboardPage,
    meta: { roles: ["Admin"] },
  },
  {
    path: "/admin/users",
    name: "AdminUsersManage",
    component: ManageUsersPage,
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/accounts",
    name: "AdminAccountsManage",
    component: ManageAccountRequestPage,
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/home",
    name: "AdminHomePage",
    component: AdminHomePage,
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/communities",
    name: "AdminCommunitiesPage",
    component: AdminCommunitiesPage,
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/communities/:slug",
    component: AdminCommunityWrapper, // Wrapper Baru
    children: [
      {
        path: "", // Default ke Posts
        name: "AdminCommunityPosts",
        component: AdminCommunityPosts,
      },
      {
        path: "forums",
        name: "AdminCommunityForums",
        component: AdminCommunityForums,
      },
      {
        path: "members",
        name: "AdminCommunityMembers",
        component: AdminCommunityMembers,
      },
      {
        path: "dashboard",
        name: "AdminCommunityDashboard",
        component: CommunityDashboardPage, // Reuse Dashboard User
      },
    ],
    meta: {
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/communities/:slug/forums/:forumId",
    name: "AdminForumDetail",
    component: AdminForumDetail,
    props: true,
    meta: { roles: ["Admin"] }, // Sesuaikan dengan guard Anda
  },
  {
    path: "/admin/reports",
    name: "AdminReportsManage",
    component: ManageReportsPage,
    meta: {
      roles: ["Admin"],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  const authStore = useAuthStore();

  if (!authStore.user) {
    try {
      await authStore.checkAuth();
    } catch (error) {
      console.error("Session check failed: ", error);
    }
  }

  const isLoggedIn = !!authStore.user;
  const userRole = authStore.user?.role;

  if (to.meta.roles && !isLoggedIn) {
    return next({ name: "LoginPage" });
  }

  if (isLoggedIn && userRole === "Mahasiswa") {
    const currentYear = new Date().getFullYear();
    const estYear = authStore.user?.tahun_perkiraan_lulus ? parseInt(authStore.user?.tahun_perkiraan_lulus) : null;

    // Check if student is expired
    const isStudentExpired = estYear && currentYear > estYear;

    // SCENARIO A: Student IS Expired
    if (isStudentExpired) {
      // If they are NOT already on the account status page, force them there
      if (to.name !== "AccountStatus") {
        return next({ name: "AccountStatus" });
      }
      // If they ARE on the account status page, allow it
      return next();
    }

    // SCENARIO B: Student IS NOT Expired but tries to access AccountStatus
    if (!isStudentExpired && to.name === "AccountStatus") {
      return next({ name: "HomePage" }); // Or redirect to where they came from
    }
  }

  // 3. Prevent Non-Mahasiswa from accessing AccountStatus
  if (to.name === "AccountStatus" && userRole !== "Mahasiswa") {
    return next({ name: "HomePage" }); // Or 403 Page
  }

  const requiredRoles = to.meta.roles;
  const publicOnly = to.meta.publicOnly;

  // 1. Cek Halaman Public Only (Login/Register)
  if (publicOnly && isLoggedIn) {
    // Jika Role adalah Admin, redirect ke AdminDashboard
    if (userRole === "Admin") {
      return next({ name: "AdminDashboard" });
    }

    // Jika User biasa, redirect ke HomePage
    return next({ name: "HomePage" });
  }

  if (to.name === "HomePage" && isLoggedIn && externalRoles.includes(userRole)) {
    return next({ name: "YourCommunities" });
  }
  if (to.name === "HomePage" && isLoggedIn && userRole === "Admin") {
    return next({ name: "AdminDashboard" });
  }
  if (to.name === "Communities" && isLoggedIn && externalRoles.includes(userRole)) {
    return next({ name: "YourCommunities" });
  }

  // 3. Cek Permission Role
  if (requiredRoles) {
    if (!isLoggedIn) {
      return next({ name: "LoginPage", query: { redirect: to.fullPath } });
    }

    if (isLoggedIn && !requiredRoles.includes(userRole)) {
      console.warn(`Akses ditolak: Role "${userRole}" tidak diizinkan ke "${to.path}"`);

      return next({ name: "ForbiddenPage" });
    }
  }

  return next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
