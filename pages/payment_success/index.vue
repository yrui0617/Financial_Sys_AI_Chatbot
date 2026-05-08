<script setup>
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const billID = ref(null);

const goBack = () => {
  router.push('/bill');
};

const bill = ref(null);

onMounted(async () => {
  try {
    billID.value = Number(route.query.billID);

    if (!billID.value) return;

    const res = await $fetch('/api/payment/confirm', {
      method: 'POST',
      body: { billID: billID.value }
    });

    bill.value = res.bill;

  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
    <div class="h-screen flex items-center justify-center bg-gray-50 p-6">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
            <!-- Loading -->
            <div v-if="loading" class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-gray-600">Processing your payment...</p>
            </div>

            <!-- Receipt Card -->
            <div v-else class="space-y-6">
                <!-- Icon -->
                <div class="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg class="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <!-- Title -->
                <h1 class="text-2xl font-bold text-gray-800">
                Payment Receipt
                </h1>   

                <!-- Receipt Card -->
                <div class="bg-gray-50 rounded-2xl p-5 text-left space-y-3 border border-gray-100">

                    <div class="flex justify-between">
                        <span class="text-gray-500">Status</span>
                        <span class="font-semibold text-emerald-600">Paid</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Bill ID</span>
                        <span class="font-medium">#B00{{ billID }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Description</span>
                        <span class="font-medium">{{ bill?.billDescription }}</span>
                    </div>

                    <div class="flex justify-between">
                        <span class="text-gray-500">Amount</span>
                        <span class="font-bold text-gray-800">
                        RM {{ bill?.billAmount }}
                        </span>
                    </div>

                    <div class="border-t pt-3 flex justify-between">
                        <span class="text-gray-600 font-medium">Total Paid</span>
                        <span class="text-emerald-600 font-bold">
                            RM {{ bill?.billAmount }}
                        </span>
                    </div>

                </div>
                <!-- Button -->
                <button
                    @click="goBack"
                    class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-xl transition"
                >
                Back to Bills
                </button>
            </div>
        </div>
    </div>
</template>