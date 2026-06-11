<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

definePageMeta({
  title: "Dashboard",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    {
      name: "Dashboard",
      path: "/",
    },
  ],
});

const userStore = useUserStore();
const isStaff = computed(() => userStore.roles?.includes('Staff'));

const billCount = ref([]);
const voucherCount = ref([]);
const paymentCount = ref([]);
const loadStats = async () => {
  try {
    const [billRes, voucherRes, paymentRes] = await Promise.all([
      $fetch('/api/bill/listbill'),
      $fetch('/api/voucher/listvoucher'),
      $fetch('/api/payment/listpayment')
    ]);
    billCount.value = billRes?.data?.length || 0
    voucherCount.value = voucherRes?.data?.length || 0
    paymentCount.value = paymentRes?.data?.length || 0
  } catch (error) {
    console.error('loadStats error:', error);
  }
};
onMounted(() => {
  loadStats()
})
</script>
<template>    
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- HERO BANNER -->
      <div class="rounded-2xl overflow-hidden shadow-lg relative">
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f"
          class="w-full h-56 object-cover opacity-83 "
        />

        <div class="absolute inset-0 flex flex-col justify-center px-8 ">
          <h2 class="text-3xl font-bold text-white border-b border-white/30 pb-2 max-w-max drop-shadow-md">
            AI Powered Financial System
          </h2>
          <p class="text-white mt-2 max-w-xl drop-shadow-md font-medium">
            Manage your bills, payments, vouchers and financial insights with an AI chatbot that understands your data instantly.
          </p>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 max-w-6xl mx-auto">

      <!-- BILL -->
      <div class="mb-10 relative p-5 rounded-xl border shadow-lg shadow-cyan-500/50 overflow-visible">

          <p class="text-md">Bills</p>

          <p class="text-2xl font-bold text-cyan-500">
              {{ billCount }}
          </p>

          <p v-if="isStaff" class="text-xs opacity-60 mt-1">Total bills created</p>
          <p v-else class="text-xs opacity-60 mt-1">Total bills need to pay</p>

          <img src="/img/buku-resit.png"
              class="absolute right-10 bottom-0 w-32 h-32 translate-x-1/3 translate-y-1/3 pointer-events-none" />
      </div>

      <!-- VOUCHER -->
      <div class="mb-10 relative p-5 rounded-xl border shadow-lg shadow-blue-500/50 overflow-visible">

          <p class="text-md ">Vouchers</p>
          <p class="text-2xl font-bold text-blue-500">
          {{ voucherCount }}
          </p>

          <p v-if="isStaff" class="text-xs opacity-60 mt-1">Total vouchers created</p>
          <p v-else class="text-xs opacity-60 mt-1">Available vouchers</p>

          <img src="/img/voucher.png"
              class="absolute right-10 bottom-0 w-32 h-32 translate-x-1/3 translate-y-1/3 pointer-events-none" />

      </div>

      <!-- PAYMENT -->
      <div class="mb-10 relative p-5 rounded-xl border  shadow-lg shadow-indigo-500/50 overflow-visible">

          <p class="text-md">Payments</p>
          <p class="text-2xl font-bold text-purple-500">
          {{ paymentCount }}
          </p>

          <p class="text-xs opacity-60 mt-1">Completed payments</p>

          <img src="/img/payment.png"
              class="absolute right-6 bottom-0 w-[190px] h-[190px] translate-x-1/3 translate-y-1/3 pointer-events-none" />
      </div>
    </div>
    
</template>