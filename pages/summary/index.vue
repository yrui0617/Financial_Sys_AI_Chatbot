<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '~/stores/user';

definePageMeta({
  title: "Financial Dashboard Overview",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    {
      name: "Summary",
      path: "/summary",
    },
  ],
});

// -------------------- STATE --------------------
const bills = ref([]);
const vouchers = ref([]);
const payments = ref([]);
const userStore = useUserStore();


// -------------------- FETCH BILLS --------------------
const fetchBills = async () => {
  try {
    const res = await $fetch('/api/bill/listbill');
    bills.value = res.data || [];
  } catch (error) {
    console.error('Fetch bills error:', error);
    bills.value = [];
  }
};

// -------------------- FETCH VOUCHERS --------------------
const fetchVouchers = async () => {
  try {
    const res = await $fetch('/api/voucher/listvoucher');
    vouchers.value = res.data || [];
  } catch (error) {
    console.error('Fetch vouchers error:', error);
    vouchers.value = [];
  }
};

// -------------------- FETCH PAYMENTS --------------------
const fetchPayments = async () => {
  try {
    const res = await $fetch('/api/payment/listpayment');

    payments.value = res.data || res;
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    payments.value = [];
  }
};

// -------------------- LOAD ALL --------------------
onMounted(async () => {
  await Promise.all([
    fetchBills(),
    fetchVouchers(),
    fetchPayments()
  ]);
});

// -------------------- DISPLAY --------------------
const recentBills = bills;
const recentVouchers = vouchers;
const recentPayments = payments;
const isStaff = computed(() => userStore.roles?.includes('Staff'));

const recentBillTableData = computed(() =>
  recentBills.value.map(createBillRow)
);

function createBillRow(bill) {
  const row = {
    BillId: bill.billID,
    billDescription: bill.billDescription,
    billAmount: bill.billAmount,
    ...(isStaff.value ? { billApprovalStatus: bill.billApprovalStatus } : {}),
    billPaymentStatus: bill.billPaymentStatus,
    billCreatedDate: bill.billCreatedDate,
    ...(isStaff.value ? { billPayerId: bill.billPayerID } : {}),
  };

  Object.defineProperty(row, 'rawBill', {
    value: bill,
    enumerable: false,
  });

  return row;
}

const recentVoucherTableData = computed(() =>
  recentVouchers.value.map((voucher) => ({
    voucherId: voucher.voucherID,
    voucherDescription: voucher.voucherDescription,
    voucherAmount: voucher.voucherAmount,
    voucherStatus: voucher.voucherStatus,
    voucherCreatedDate: voucher.voucherCreatedDate,
    sourceBillId: voucher.voucherBillID,
  }))
);

const recentPaymentTableData = computed(() =>
  recentPayments.value.map((payment) => ({
    paymentId: payment.paymentID,
    paymentDescription: payment.paymentDescription,
    paymentAmount: payment.paymentAmount,
    paymentCreatedDate: payment.paymentCreatedDate,
    paymentStatus: payment.paymentStatus,
    sourceBillId: payment.paymentBillID,
    ...(isStaff.value ? { paymentPayerId: payment.paymentPayerID } : {}),
  }))
);

// -------------------- UTIL --------------------
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MYR'
  }).format(value);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-MY', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(date));
};
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
</script>

<template>
  <div class="space-y-8">
    <LayoutsBreadcrumb />

    <rs-card class="transition-all duration-300">
      <div class="p-6">
        <h1 class="text-3xl font-bold text-primary flex items-center gap-2">
          <Icon name="ph:squares-four-duotone" />
          Financial Information Summary
        </h1>
        <p class="text-gray-600 ">
        Quick glance at recent activity across the financial lifecycle.</p>
      </div>
      
      <div class="space-y-4">
        </div>
      </rs-card>
    </div>

    <div class="space-y-8 pt-10">
      <div class="space-y-4">
        <h3 class="text-xl font-semibold text-primary flex items-center gap-2">
          <Icon name="ph:receipt-duotone" size="20" />
          Recent Bills
        </h3>
        <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
          <rs-table
            :data="recentBillTableData"
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
            <template v-slot:billAmount="data">
              {{ formatCurrency(data.text) }}
            </template>

            <template v-slot:billApprovalStatus="data">
              <rs-badge :variant="getStatusVariant(data.text)">
                {{ data.text }}
              </rs-badge>
            </template>
            <template v-slot:billPaymentStatus="data">
              <rs-badge :variant="getStatusVariant(data.text)">
                {{ data.text }}
              </rs-badge>
            </template>
            
            <template v-slot:billCreatedDate="data">
              {{ formatDate(data.text) }}
            </template>
          </rs-table>
        </rs-card>
      </div>

      <div class="space-y-4">
        <h3 class="text-xl font-semibold text-primary flex items-center gap-2">
          <Icon name="ph:ticket-duotone" size="20" />
          Recent Vouchers
        </h3>
        <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
          <rs-table
            :data="recentVoucherTableData"
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
            <template v-slot:voucherAmount="data">
              {{ formatCurrency(data.text) }}
            </template>

            <template v-slot:voucherStatus="data">
              <rs-badge :variant="getStatusVariant(data.text)">
                {{ data.text }}
              </rs-badge>
            </template>

            <template v-slot:voucherCreatedDate="data">
              {{ formatDate(data.text) }}
            </template>

            <template v-slot:sourceBillId="data">
              #B00{{ data.text }}
            </template>
          </rs-table>
        </rs-card>
      </div>

      <div class="space-y-4 pb-20">
        <h3 class="text-xl font-semibold text-primary flex items-center gap-2">
          <Icon name="ph:wallet-duotone" size="20" />
          Recent Payments
        </h3>
        <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
          <rs-table
            :data="recentPaymentTableData"
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
            <template v-slot:paymentAmount="data">
              {{ formatCurrency(data.text) }}
            </template>

            <template v-slot:paymentCreatedDate="data">
              {{ formatDate(data.text) }}
            </template>

            <template v-slot:paymentStatus="data">
              <rs-badge :variant="getStatusVariant(data.text)">
                {{ data.text }}
              </rs-badge>
            </template>

            <template v-slot:sourceBillId="data">
              #B00{{ data.text }}
            </template>
          </rs-table>
        </rs-card>
      </div>
    </div>

</template>
