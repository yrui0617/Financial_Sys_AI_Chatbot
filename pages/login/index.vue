<script setup>
import { useUserStore } from "~/stores/user";

definePageMeta({
  title: "Financial Login",
  layout: "empty",
});

const { $swal } = useNuxtApp();
const { siteSettings, loading: siteSettingsLoading } = useSiteSettings();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const isSubmitting = ref(false);
const togglePasswordVisibility = ref(false);

const userStore = useUserStore();

// Get login logo with fallback
const getLoginLogo = () => {
  if (siteSettingsLoading.value) {
    return "/img/logo/financial_system.png";
  }
  return siteSettings.value?.siteLoginLogo || "/img/logo/financial_system.png";
};

// Get site name with fallback
const getSiteName = () => {
  if (siteSettingsLoading.value) {
    return "Financial Portal";
  }
  return siteSettings.value?.siteName || "Financial Portal";
};

const login = async () => {
  if (!username.value || !password.value) {
    $swal.fire({
      title: "Incomplete details",
      text: "Please enter both username and password.",
      icon: "warning",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await useFetch("/api/auth/login", {
      method: "POST",
      initialCache: false,
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = res.data.value;

    if (data?.statusCode === 200) {
      userStore.setUsername(data.data.username);
      userStore.setFullName(data.data.fullName || data.data.username);
      userStore.setRoles(data.data.roles);
      userStore.setUserId(data.data.userId);
      userStore.setIsAuthenticated(true);

      $swal.fire({
        position: "center",
        title: "Signed in",
        text: "You are now logged into the Financial System.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      if (userStore.roles?.includes('Admin')) {
        window.location.href = "/dashboard_admin";
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      $swal.fire({
        title: "Unable to sign in",
        text: data?.message || "Check your username and password, then try again.",
        icon: "error",
      });
    }
  } catch (error) {
    console.error(error);
    $swal.fire({
      title: "System error",
      text: "Something went wrong while signing in. Please try again.",
      icon: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Remember username and password if requested
onMounted(() => {
  if (process.client) {
    const savedUsername = localStorage.getItem("financial-login-username");
    const savedPassword = localStorage.getItem("financial-login-password");

    if (savedUsername) username.value = savedUsername;
    if (savedPassword) password.value = savedPassword;

    if (savedUsername || savedPassword) rememberMe.value = true;
  }
});

watch(rememberMe, (value) => {
  if (!process.client) return;
  if (value) {
    if (username.value) {
      localStorage.setItem("financial-login-username", username.value);
    }
    if (password.value) {
      localStorage.setItem("financial-login-password", password.value);
    }
  } else {
    localStorage.removeItem("financial-login-username");
    localStorage.removeItem("financial-login-password");
  }
});

watch(username, (value) => {
  if (!process.client) return;
  if (rememberMe.value && value) {
    localStorage.setItem("financial-login-username", value);
  }
});

watch(password, (value) => {
  if (!process.client) return;
  if (rememberMe.value && value) {
    localStorage.setItem("financial-login-password", value);
  }
});
</script>

<template>
  <div
    class="h-screen w-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
  >
    <img src="/img/login_background.png" class="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
    <div
      class="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10"
    >
      <!-- Left: Financial hero / insights -->
      <div class="hidden lg:flex flex-col text-gray-900 space-y-6">
        
        <div class="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"
            >
              <Icon
                name="ph:currency-circle-dollar"
                class="text-emerald-600"
                size="22"
              />
            </div>
            <div>
              <p class="text-md font-bold uppercase tracking-[0.25em] text-emerald-800">
                Finance System
              </p>
              <h1 class="text-2xl font-semibold">
                A system that integrates with AI Chatbot
              </h1>
            </div>
          </div>

          <p class="text-sm text-black max-w-md ">
            Monitor payments status, bill generation, and vouchers created when bill was approved. 
            <br>
            Designed for improve the efficiency of the finance officers.
          </p>
        </div>   
        <div
          class="grid grid-cols-2 gap-4 text-sm [&>div]:rounded-2xl [&>div]:border [&>div]:border-gray-300 [&>div]:bg-black-50"
        >
          <div class="p-4 space-y-2 bg-white/20 backdrop-blur-md border border-white/30">
            <p class="text-xs text-black uppercase tracking-wide">
              Support
            </p>
            <p class="text-2xl font-semibold text-black">
              24/7 services
            </p>
            <p class="text-xs text-black flex items-center gap-1 ">
              <Icon
                name="ph:clock-duotone"
                class="text-emerald-600"
                size="16"
              />
              24 hours a day, 7 days a week
            </p>
          </div>

          <div class="p-4 space-y-2 bg-white/20 backdrop-blur-md border border-white/30">
            <p class="text-xs text-gray-500 uppercase tracking-wide">
            </p>
            <p class="text-2xl font-semibold text-black">
              Handle financial queries instantly
            </p>
            <p class="text-xs text-gray-700">
              <Icon
                name="ph:chat-circle-dots"
                class="text-emerald-600"
                size="16"
              />
              responsive and accurate answers
            </p>
          </div>
        </div>

  
      </div>

      <!-- Right: Login card -->
      <div class="w-full">
        <rs-card
          class="relative overflow-hidden bg-white border border-gray-300 shadow-2xl rounded-xl"
        >
          <div
            class="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"
          />
          <div class="relative px-8 py-10 space-y-8">
            <!-- Logo -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img/>
              </div>
            </div>

            <!-- Title -->
            <div class="space-y-1 text-left">
              <h2 class="text-2xl font-semibold text-gray-900">
                Sign in to Financial System
              </h2>
              <p class="text-sm text-gray-600">
                Enter your credentials to access the System.
              </p>
            </div>

            <!-- Form -->
            <div class="grid grid-cols-2 gap-4">
              <FormKit
                type="text"
                v-model="username"
                label="Username"
                validation="required"
                placeholder="e.g. johndoe"
                :classes="{
                  outer: 'col-span-2',
                  label: 'text-left text-gray-700 mb-1',
                  inner: 'bg-white border-gray-300 focus-within:border-emerald-400',
                  messages: 'text-left',
                  input:
                    'bg-transparent text-gray-900 placeholder:text-gray-500',
                }"
                :validation-messages="{
                  required: 'Username is required.',
                }"
              />

              <FormKit
                :type="togglePasswordVisibility ? 'text' : 'password'"
                v-model="password"
                label="Password"
                validation="required"
                placeholder="Enter your password"
                :classes="{
                  outer: 'col-span-2',
                  label: 'text-left text-gray-700 mb-1',
                  inner: 'bg-white border-gray-300 focus-within:border-emerald-400',
                  messages: 'text-left',
                  input:
                    'bg-transparent text-gray-900 placeholder:text-gray-500',
                }"
                :validation-messages="{
                  required: 'Password is required.',
                }"
              >
                <template #prefixIcon>
                  <Icon
                    name="ph:lock-key-duotone"
                    class="!w-5 !h-5 ml-3 text-gray-400"
                  />
                </template>
                <template #suffix>
                  <button
                    type="button"
                    class="bg-white hover:bg-gray-50 h-full rounded-r-md px-3 flex justify-center items-center text-gray-400"
                    @click="togglePasswordVisibility = !togglePasswordVisibility"
                  >
                    <Icon
                      v-if="!togglePasswordVisibility"
                      name="ph:eye-duotone"
                      size="18"
                    />
                    <Icon
                      v-else
                      name="ph:eye-slash-duotone"
                      size="18"
                    />
                  </button>
                </template>
              </FormKit>

              <div
                class="col-span-2 flex items-center justify-between text-xs text-gray-600"
              >
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="rememberMe"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0 bg-white"
                  />
                  <span>Remember me</span>
                </label>

              </div>

              <FormKit
                type="button"
                input-class="w-full"
                outer-class="col-span-2"
                :disabled="isSubmitting"
                @click="login"
                :classes="{
                  input:
                    'w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-md flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed',
                }"
              >
                <span v-if="!isSubmitting">Sign in</span>
                <span v-else>Signing in...</span>
                <Icon
                  v-if="!isSubmitting"
                  name="ph:arrow-right-duotone"
                  class="!w-5 !h-5"
                />
                <Icon
                  v-else
                  name="ph:spinner-gap-duotone"
                  class="!w-5 !h-5 animate-spin"
                />
              </FormKit>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500 pt-2 border-t border-gray-300 mt-4"
            >
              <p>
              </p>
              <p class="flex items-center gap-1">
              </p>
            </div>
          </div>
        </rs-card>
      </div>
    </div>
  </div>
</template>


