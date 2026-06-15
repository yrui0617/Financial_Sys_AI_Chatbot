<script setup>
import { ref, computed, onMounted } from 'vue';
import { watch } from 'vue';
import { useUserStore } from '~/stores/user';

definePageMeta({
  title: "Bill Management",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    { name: "Bill Management", path: "/bill" },
  ],
});

const bills = ref([]);
const isCreateEditModalOpen = ref(false);
const currentBill = ref(null);
const searchTerm = ref('');
const isSubmitting = ref(false);
const userStore = useUserStore();

// -------------------- FETCH BILLS --------------------
const fetchBills = async () => {
  try {
    const res = await $fetch('/api/bill/listbill');
    bills.value = res.data || [];
  } catch (error) {
    console.error('Fetch bills error:', error);
    bills.value = [];
    showError(error?.data?.message || error.message || 'Unable to load bills');
  }
};

// -------------------- SEARCH FILTER --------------------
const filteredBills = computed(() => {
  if (!searchTerm.value) return bills.value;

  const lower = searchTerm.value.toLowerCase();

  return bills.value.filter(b =>
    b.billDescription?.toLowerCase().includes(lower) ||
    b.billApprovalStatus?.toLowerCase().includes(lower) ||
    b.billPaymentStatus?.toLowerCase().includes(lower)
  );
});

const isStaff = computed(() => userStore.roles?.includes('Staff'));

const billTableData = computed(() =>
  filteredBills.value.map(createBillRow)
);

function createBillRow(bill) {
  const row = {
    billId: bill.billID,
    Description: bill.billDescription,
    Amount: bill.billAmount,
    ...(isStaff.value ? { ApprovalStatus: bill.billApprovalStatus } : {}),
    PaymentStatus: bill.billPaymentStatus,
    CreatedDate: bill.billCreatedDate,
    ...(isStaff.value ? { PayerId: bill.billPayerID } : {}),
    action: '',
  };

  Object.defineProperty(row, 'rawBill', {
    value: bill,
    enumerable: false,
  });

  return row;
}
// -------------------- OPEN CREATE --------------------
const openCreateModal = () => {
  currentBill.value = {
    billDescription: '',
    billAmount: '',
    billDate: '',
    billApprovalStatus: 'Pending',
    billPaymentStatus: 'Unpaid',
    billPayerID: ''
  };
  isCreateEditModalOpen.value = true;
};

// -------------------- OPEN EDIT --------------------
const openEditModal = (bill) => {
  currentBill.value = {
    ...bill,
    billCreatedDate: bill.billCreatedDate ? bill.billCreatedDate.split('T')[0] : ''
  };

  isCreateEditModalOpen.value = true;
};
// -------------------- CLOSE MODAL --------------------
const closeCreateEditModal = () => {
  isCreateEditModalOpen.value = false;
  currentBill.value = null;
};

// -------------------- SAVE (CREATE / UPDATE) --------------------
const saveBill = async () => {
  const isUpdate = !!currentBill.value?.billID;

  try {
    isSubmitting.value = true;

    // For updates, send description and amount, and set status to Pending
    const updateData = isUpdate ? {
      billDescription: currentBill.value.billDescription,
      billAmount: currentBill.value.billAmount,
      billApprovalStatus: currentBill.value.billApprovalStatus,
      billPaymentStatus: currentBill.value.billPaymentStatus,
    } : currentBill.value;

    const res = isUpdate
      ? await $fetch(`/api/bill/updatebill/${currentBill.value.billID}`, {
          method: 'PUT',
          body: updateData,
        })
      : await $fetch('/api/bill/createbill', {
          method: 'POST',
          body: currentBill.value,
        });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
      throw new Error(res.message || 'Unable to save bill');
    }

    await fetchBills();
    closeCreateEditModal();
    showSuccess(isUpdate ? 'Bill updated successfully' : 'Bill created successfully');
  } catch (error) {
    console.error('Save bill error:', error);
    showError(error?.data?.message || error.message || 'Unable to save bill');
  } finally {
    isSubmitting.value = false;
  }
};

// -------------------- DELETE --------------------
const isConfirmOpen = ref(false);
const deleteId = ref(null);

// open confirm modal
const confirmDelete = (id) => {
  deleteId.value = id;
  isConfirmOpen.value = true;
};

// execute delete
const successMessage = ref('');
const errorMessage = ref('');

const deleteBillConfirmed = async () => {
  try {
    const res = await $fetch(`/api/bill/deletebill/${deleteId.value}`, {
      method: 'DELETE',
    });

    if (res.statusCode !== 200) {
      throw new Error(res.message);
    }

    showSuccess("Bill deleted successfully");

    await fetchBills();

  } catch (error) { // ✅ FIXED HERE
    console.error("DELETE ERROR:", error);

    showError(
      error?.data?.message || error.message || "Delete failed"
    );
  } finally {
    isConfirmOpen.value = false;
    deleteId.value = null;
  }
};

// -------------------- PAY --------------------
const payBill = async (bill) => {
  
  try {
    const res = await $fetch('/api/payment/makepayment', {
      method: 'POST',
      body: {
        billID: bill.billID
      }
    });

    window.location.href = res.url;

  } catch (error) {
    console.error(error);
    showError(error?.data?.message || error.message || 'Payment failed');
  }
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

    <rs-card class="transition-all duration-300 overflow-x-auto">
      <div class="p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="space-y-1">
            <h1 class="text-3xl font-bold text-primary flex items-center gap-2">
              <Icon name="ph:receipt-duotone" />
              Bill Management System
            </h1>
            <p class="text-gray-600">
              Overview of all financial bills, their status, and actions.
            </p>
          </div>
          <button v-if="isStaff"
            @click="openCreateModal"
            class="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Icon name="ph:plus-circle-duotone" class="!w-5 !h-5" />
            Create New Bill
          </button>
        </div>
      </div>
    </rs-card>

    <div class="space-y-6">

      <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
        <rs-table
          :data="billTableData"
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

          <template v-slot:ApprovalStatus="data">
            <rs-badge :variant="getStatusVariant(data.text)">
              {{ data.text }}
            </rs-badge>
          </template>

          <template v-slot:PaymentStatus="data">
            <rs-badge :variant="getStatusVariant(data.text)">
              {{ data.text }}
            </rs-badge>
          </template>

          <template v-slot:CreatedDate="data">
            {{ formatDate(data.text) }}
          </template>

          <template v-slot:action="data">
            <div v-if="isStaff">
              <button
                @click="openEditModal(data.value.rawBill)"
                class="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-gray-100 transition"
                title="Edit"
              >
                <Icon name="ph:pencil-line-duotone" size="20" />
              </button>
              <button
                @click="confirmDelete(data.value.billId)"
                class="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition"
                title="Delete"
              >
                <Icon name="ph:trash-duotone" size="20" />
              </button>
              
            </div>
            <div v-else>
              <button @click="payBill(data.value.rawBill)" class=" flex justify-start">
                <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-emerald-500 hover:text-emerald-700">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                Pay
              </button>
            </div>
          </template>
        </rs-table>
      </rs-card>
      <Teleport to="body">
        <div
          v-if="successMessage"
          class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-green-100 text-green-700 rounded-lg shadow-lg"
        >
          {{ successMessage }}
        </div>

        <div
          v-if="errorMessage"
          class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-red-100 text-red-700 rounded-lg shadow-lg"
        >
          {{ errorMessage }}
        </div>
      </Teleport>
    </div>
  <!-- CONFIRMATION MODAL -->
  <Teleport to="body">
  <div
    v-if="isConfirmOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  >
    <rs-card class="w-full max-w-md">
      <div class="p-6 space-y-4 text-center">

        <h2 class="text-xl font-semibold text-gray-900">
          Confirm Delete
        </h2>

        <p class="text-gray-600">
          Are you sure you want to delete this bill? This action cannot be undone.
        </p>

        <div class="flex justify-center gap-3 pt-4">

          <button
            @click="isConfirmOpen = false"
            class="px-4 py-2 rounded-md bg-gray-200"
          >
            Cancel
          </button>

          <button
            @click="deleteBillConfirmed"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>

        </div>

      </div>
    </rs-card>
  </div>
  </Teleport>

  
    <div
      v-if="isCreateEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="closeCreateEditModal"
    >
      <rs-card class="w-full max-w-lg transition-all duration-300">
        <div class="p-6 space-y-6">
          <h3 class="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
            {{ currentBill?.billID ? 'Edit Bill' : 'Create New Bill' }}
          </h3>

          <form @submit.prevent="saveBill" class="space-y-4">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Description</span>
              <input
                v-model="currentBill.billDescription"
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
                v-model.number="currentBill.billAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
                placeholder="e.g. 1500.00"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Payer ID</span>
              <input
                v-model.number="currentBill.billPayerID"
                type="number"
                min="1"
                required
                :disabled="!!currentBill?.billID"
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
                :class="{ 'cursor-not-allowed opacity-60': currentBill?.billID }"
                placeholder="Enter the User ID of the payer"
              />
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
                <span v-if="!isSubmitting">{{ currentBill?.billID ? 'Save Changes' : 'Create Bill' }}</span>
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
  </div>
</template>
