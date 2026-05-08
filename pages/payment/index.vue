<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';

definePageMeta({
  title: "Payment Information",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    {
      name: "Payment Information",
      path: "/payment",
    },
  ],
});

// ---------------- DATA ----------------
const payments = ref([]);
const searchTerm = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const bills = ref([]);
const currentPayment = ref(null);
const isCreateEditModalOpen = ref(false);
const isSubmitting = ref(false);
const userStore = useUserStore();
const isStaff = computed(() => userStore.roles?.includes('Staff'));

// ---------------- FETCH ----------------
const fetchPayments = async () => {
  try {
    const res = await $fetch('/api/payment/listpayment');

    payments.value = res.data || res;
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    payments.value = [];
    showError(error?.data?.message || error.message || 'Unable to load payments');
  }
};

onMounted(fetchPayments);

// ---------------- FILTER ----------------
const filteredPayments = computed(() => {
  if (!searchTerm.value) return payments.value;

  const lower = searchTerm.value.toLowerCase();

  return payments.value.filter(payment =>
    payment.paymentDescription?.toLowerCase().includes(lower) ||
    String(payment.paymentBillID).includes(lower) ||
    payment.paymentStatus?.toLowerCase().includes(lower)
  );
});

const paymentTableData = computed(() =>
  filteredPayments.value.map((payment) => ({
    paymentId: payment.paymentID,
    Description: payment.paymentDescription,
    Amount: payment.paymentAmount,
    Status: payment.paymentStatus,
    CreatedDate: payment.paymentCreatedDate,
    SourceBillId: payment.paymentBillID,
    ...(isStaff.value ? { PayerId: payment.paymentPayerID } : {}),
  }))
);

// ---------------- STATUS ----------------
const getStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
    case 'paid':
    case 'success':
      return 'success';
    
    case 'unpaid':
      return 'info';

    case 'pending':
    case 'scheduled':
      return 'warning';

    case 'rejected':
    case 'expired':
      return 'danger';

    default:
      return 'secondary';
  }
};
// ---------------- FORMAT ----------------
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MYR'
  }).format(value);
};

// ---------------- DATE ----------------
const formatDate = (date) => {
  if (!date) return '';
  return date.split('T')[0];
};

// -------------------- TOAST MESSAGES --------------------
let successTimer = null;
let errorTimer = null;

watch(successMessage, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
  }
});

watch(errorMessage, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  }
});

const showSuccess = (msg) => {
  successMessage.value = msg;

  if (successTimer) clearTimeout(successTimer);

  successTimer = setTimeout(() => {
    successMessage.value = '';
  }, 5000);
};

const showError = (msg) => {
  errorMessage.value = msg;

  if (errorTimer) clearTimeout(errorTimer);

  errorTimer = setTimeout(() => {
    errorMessage.value = '';
  }, 5000);
};


</script>

<template>
  <div class="space-y-8">
    <LayoutsBreadcrumb />

    <rs-card class="transition-all duration-300">
      <div class="p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="space-y-1">
            <h1 class="text-3xl font-bold text-primary flex items-center gap-2">
              <Icon name="ph:wallet-duotone" />
              Payment Information
            </h1>
            <p class="text-gray-600 ">
              List of all payments initiated, referencing source vouchers.
            </p>
          </div>
        </div>
      </div>
    </rs-card>

    <div class="space-y-6">
      
      <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
        <rs-table
          :data="paymentTableData"
          :options="{
            variant: 'default',
            striped: true,
            borderless: true,
          }"
          :options-advanced="{
            sortable: true,
            responsive: true,
            filterable: false,
          }"
          advanced
        >
          <template v-slot:Amount="data">
            {{ formatCurrency(data.text) }}
          </template>

          <template v-slot:CreatedDate="data">
            {{ formatDate(data.text) }}
          </template>

          <template v-slot:Status="data">
            <rs-badge :variant="getStatusVariant(data.text)">
              {{ data.text }}
            </rs-badge>
          </template>

          <template v-slot:SourceBillId="data">
            #B00{{ data.text }}
          </template>
        </rs-table>
      </rs-card>
    </div>
  </div>

  <div
      v-if="isCreateEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="closeCreateEditModal"
    >
      <rs-card class="w-full max-w-lg transition-all duration-300">
        <div class="p-6 space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Create New Payment
          </h3>

          <form @submit.prevent="savePayment" class="space-y-4">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Description</span>
              <input
                v-model="currentPayment.paymentDescription"
                type="text"
                maxlength="255"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
                placeholder="e.g. Q4 Server Maintenance Invoice"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Amount</span>
              <input
                v-model.number="currentPayment.paymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
                placeholder="e.g. 1500.00"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Source Bill</span>
              <select
                v-model="currentPayment.billID"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
              >
                <option value="">Select a bill...</option>
                <option
                  v-for="bill in bills"
                  :key="bill.billID"
                  :value="bill.billID"
                >
                  #B00{{ bill.billID }} - {{ bill.billDescription }} ({{ formatCurrency(bill.billAmount) }})
                </option>
              </select>
            </label>

            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeCreateEditModal"
                class="px-4 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium rounded-md bg-primary hover:bg-primary/90 text-white flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span v-if="!isSubmitting">Create Payment</span>
                <span v-else>
                  <Icon name="ph:spinner-gap-duotone" class="!w-5 !h-5 animate-spin mr-1" />
                  Saving...
                </span>
              </button>
            </div>
          </form>
        </div>
      </rs-card>
    </div>

</template>
