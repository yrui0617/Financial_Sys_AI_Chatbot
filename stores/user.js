import { defineStore } from "pinia";

export const useUserStore = defineStore({
  id: "user",
  state: () => ({
    username: null,
    fullName: null,
    roles: null,
    userId: null,
    isAuth: false,
  }),
  persist: true,
  actions: {
    setUsername(username) {
      this.username = username;
    },
    setFullName(fullName) {
      this.fullName = fullName;
    },
    setRoles(roles) {
      this.roles = roles;
    },
    setUserId(userId) {
      this.userId = userId;
    },
    setIsAuthenticated(isAuth) {
      this.isAuth = isAuth;
    },
  },
});
