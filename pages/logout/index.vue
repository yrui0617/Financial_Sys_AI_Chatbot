<script setup>
import { useUserStore } from "~/stores/user";

definePageMeta({
  title: "Logout",
  layout: "empty",
});

const userStore = useUserStore();

await useFetch("/api/auth/logout", {
  method: "GET",
});

if (process.client) {
  userStore.setUsername("");
  userStore.setFullName("");
  userStore.setRoles([]);
  userStore.setUserId(null);
  userStore.setIsAuthenticated(false);

  navigateTo("/login");
}
</script>

<template>
  <div>
    <h1>Logout</h1>
  </div>
</template>
