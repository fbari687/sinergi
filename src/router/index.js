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
import CommunitiesFeedsPage from "@/views/CommunitiesFeedsPage.vue";
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

const allRoles = ["Admin", "Dosen", "Mahasiswa", "Alumni", "Mitra", "Pakar"];
const internalRoles = ["Admin", "Dosen", "Mahasiswa"];
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
    path: "/register",
    name: "RegisterPage",
    component: RegisterPage,
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
      roles: allRoles,
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
    path: "/communities/feeds",
    name: "CommunitiesFeed",
    component: CommunitiesFeedsPage,
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
    path: "/admin/dashboard",
    name: "AdminDashboard",
    component: DashboardPage,
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

  // 2. Jika Admin mencoba akses HomePage (/), redirect ke AdminDashboard
  if (to.name === "HomePage" && isLoggedIn && userRole === "Admin") {
    return next({ name: "AdminDashboard" });
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
