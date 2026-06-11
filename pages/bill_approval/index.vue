<script setup>
import { ref, computed, onMounted, watch } from 'vue';

definePageMeta({
  title: "Bill Management",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    { name: "Bill Management", path: "/bill_approval" },
  ],
});

const bills = ref([]);
const successMessage = ref('');
const errorMessage = ref('');

// -------------------- FETCH BILLS --------------------
const fetchBills = async () => {
  try {
    const res = await $fetch('/api/bill/pendingbill');

    console.log("API RESPONSE:", res);

    bills.value = res.data ?? res ?? [];
    console.log("BILLS:", bills.value);

  } catch (error) {
    console.error('Fetch bills error:', error);
    bills.value = [];
    showError('Unable to load bills');
  }
};

// -------------------- ONLY PENDING --------------------
const filteredBills = computed(() => {
  return bills.value.filter(b =>
    (b.billApprovalStatus || '').toLowerCase() === 'pending'
  );
});

const approvalTableData = computed(() =>
  filteredBills.value.map((bill) => ({
    billId: bill.billID,
    Description: bill.billDescription,
    Amount: bill.billAmount,
    Status: bill.billApprovalStatus,
    CreatedDate: bill.billCreatedDate,
    CreatorId: bill.billCreatorID,
    PayerId: bill.billPayerID,
    action: '',
  }))
);

// -------------------- UPDATE STATUS --------------------
const updateStatus = async (id, status) => {
  try {
    await $fetch(`/api/bill/updatebill/${id}`, {
      method: 'PUT',
      body: { billApprovalStatus: status }
    });

    showSuccess(`Bill ${status}`);

    // refresh list after update
    await fetchBills();

  } catch (error) {
    console.error(error);
    showError(error?.data?.message || 'Failed to update bill');
  }
};

// -------------------- TOAST --------------------
let successTimer = null;
let errorTimer = null;

watch(successMessage, (val) => {
  if (val) {
    clearTimeout(successTimer);
    successTimer = setTimeout(() => successMessage.value = '', 5000);
  }
});

watch(errorMessage, (val) => {
  if (val) {
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => errorMessage.value = '', 5000);
  }
});

const showSuccess = (msg) => {
  successMessage.value = msg;
};

const showError = (msg) => {
  errorMessage.value = msg;
};

const getStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return 'success';

    case 'pending':
      return 'warning';

    case 'rejected':
      return 'danger';

    default:
      return 'secondary';
  }
};

// -------------------- FORMAT --------------------
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

// -------------------- INIT --------------------
onMounted(() => {
  fetchBills();
});
</script>

<template>
  <div class="space-y-8">
    <LayoutsBreadcrumb />

    <!-- HEADER -->
    <rs-card>
      <div class="p-6 ">
        <h1 class="text-3xl font-bold text-primary flex items-center gap-2">
          <Icon name="ph:receipt-duotone" />
          Bill Approval System
        </h1>
        <p class="text-gray-600">
          Approve or reject pending bills submitted by users.
        </p>
      </div>
    </rs-card>

    <!-- TABLE -->
    <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
      <rs-table
        :data="approvalTableData"
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

        <template v-slot:Status="data">
          <rs-badge :variant="getStatusVariant(data.text)">
            {{ data.text }}
          </rs-badge>
        </template>

        <template v-slot:CreatedDate="data">
          {{ formatDate(data.text) }}
        </template>

        <template v-slot:action="data">
          <div class="flex gap-2">
            <button
              @click="updateStatus(data.value.billId, 'Approved')"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white transition hover:bg-teal-600"
              title="Approve"
            >
              <Icon name="ph:check" size="18" />
            </button>

            <button
              @click="updateStatus(data.value.billId, 'Rejected')"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
              title="Reject"
            >
              <Icon name="ph:x" size="18" />
            </button>
          </div>
        </template>
      </rs-table>
    </rs-card>

    <!-- TOAST -->
    <Teleport to="body">
      <div
        v-if="successMessage"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-3 bg-green-100 text-green-700 rounded shadow"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="errorMessage"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-3 bg-red-100 text-red-700 rounded shadow"
      >
        {{ errorMessage }}
      </div>
    </Teleport>

  </div>
</template>
