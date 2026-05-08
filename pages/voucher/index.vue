<script setup>
import { ref, computed, onMounted } from 'vue';
import { watch } from 'vue';
import { useUserStore } from '~/stores/user';

definePageMeta({
  title: "Voucher Management",
  middleware: ["auth"],
  requiresAuth: true,
  breadcrumb: [
    { name: "Voucher Management", path: "/voucher" },
  ],
});

const vouchers = ref([]);
const bills = ref([]);
const isCreateEditModalOpen = ref(false);
const currentVoucher = ref(null);
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

// -------------------- FETCH VOUCHERS --------------------
const fetchVouchers = async () => {
  try {
    const res = await $fetch('/api/voucher/listvoucher');
    vouchers.value = res.data || [];
  } catch (error) {
    console.error('Fetch vouchers error:', error);
    vouchers.value = [];
    showError(error?.data?.message || error.message || 'Unable to load vouchers');
  }
};

// -------------------- SEARCH FILTER --------------------
const filteredVouchers = computed(() => {
  if (!searchTerm.value) return vouchers.value;

  const lower = searchTerm.value.toLowerCase();

  return vouchers.value.filter(v =>
    v.voucherDescription?.toLowerCase().includes(lower) ||
    v.voucherStatus?.toLowerCase().includes(lower) ||
    v.voucherBill?.billDescription?.toLowerCase().includes(lower)
  );
});

const isStaff = computed(() => userStore.roles?.includes('Staff'));

const voucherTableData = computed(() =>
  filteredVouchers.value.map(createVoucherRow)
);

function createVoucherRow(voucher) {
  const row = {
    voucherId: voucher.voucherID,
    Description: voucher.voucherDescription,
    Amount: voucher.voucherAmount,
    Status: voucher.voucherStatus,
    CreatedDate: voucher.voucherCreatedDate,
    SourceBillId: voucher.voucherBillID,
    ...(isStaff.value ? {action: ''} : {}),
  };
  Object.defineProperty(row, 'rawVoucher', {
    value: voucher,
    enumerable: false,
  });

  return row;
}

// -------------------- OPEN CREATE --------------------
const openCreateModal = () => {
  currentVoucher.value = {
    voucherDescription: '',
    voucherAmount: '',
    voucherCreatedDate: '',
    voucherBillID: '',
    voucherStatus: 'Pending'
  };
  isCreateEditModalOpen.value = true;
};

// -------------------- OPEN EDIT --------------------
const openEditModal = (voucher) => {
  currentVoucher.value = {
    ...voucher,
    voucherCreatedDate: voucher.voucherCreatedDate ? voucher.voucherCreatedDate.split('T')[0] : '',
  };

  isCreateEditModalOpen.value = true;
};
// -------------------- CLOSE MODAL --------------------
const closeCreateEditModal = () => {
  isCreateEditModalOpen.value = false;
  currentVoucher.value = null;
};

// -------------------- SAVE (CREATE / UPDATE) --------------------
const saveVoucher = async () => {
  const isUpdate = !!currentVoucher.value?.voucherID;

  try {
    isSubmitting.value = true;

    // For updates, keep the original bill and only send editable fields.
    const updateData = isUpdate ? {
      voucherDescription: currentVoucher.value.voucherDescription,
      voucherAmount: currentVoucher.value.voucherAmount,
      voucherStatus: 'Pending'
    } : currentVoucher.value;

    const res = isUpdate
      ? await $fetch(`/api/voucher/updatevoucher/${currentVoucher.value.voucherID}`, {
          method: 'PUT',
          body: updateData,
        })
      : await $fetch('/api/voucher/createvoucher', {
          method: 'POST',
          body: currentVoucher.value,
        });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
      throw new Error(res.message || 'Unable to save voucher');
    }

    await fetchVouchers();
    closeCreateEditModal();
    showSuccess(isUpdate ? 'Voucher updated successfully' : 'Voucher created successfully');
  } catch (error) {
    console.error('Save voucher error:', error);
    showError(error?.data?.message || error.message || 'Unable to save voucher');
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

const deleteVoucherConfirmed = async () => {
  try {
    const res = await $fetch(`/api/voucher/deletevoucher/${deleteId.value}`, {
      method: 'DELETE',
    });

    if (res.statusCode !== 200) {
      throw new Error(res.message);
    }

    showSuccess("Voucher deleted successfully");

    await fetchVouchers();

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

const getStatusVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'approved':
    case 'active':
    case 'completed':
      return 'success';

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
  fetchVouchers();
});
</script>

<template>
  <div class="space-y-8">
    <LayoutsBreadcrumb />

    <rs-card class="transition-all duration-300">
      <div class="p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="space-y-1">
            <h1 class="text-3xl font-bold text-primary flex items-center gap-2">
              <Icon name="ph:receipt-duotone" />
              Voucher Management System
            </h1>
            <p class="text-gray-600">
              Overview of all financial vouchers, their status, and actions.
            </p>
          </div>
          <button
            @click="openCreateModal"
            class="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            <Icon name="ph:plus-circle-duotone" class="!w-5 !h-5" />
            Create New Voucher
          </button>
        </div>
      </div>
    </rs-card>

    <div class="space-y-6">
      <rs-card class="transition-all duration-300 overflow-x-auto m-auto mb-20">
        <rs-table
          :data="voucherTableData"
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

          <template v-slot:SourceBillId="data">
            #B00{{ data.text }}
          </template>

          <template v-slot:action="data">
            <div>
              <button
                @click="openEditModal(data.value.rawVoucher)"
                class="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-gray-100 transition"
                title="Edit"
              >
                <Icon name="ph:pencil-line-duotone" size="20" />
              </button>
              <button
                @click="confirmDelete(data.value.voucherID)"
                class="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition"
                title="Delete"
              >
                <Icon name="ph:trash-duotone" size="20" />
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
          Are you sure you want to delete this voucher? This action cannot be undone.
        </p>

        <div class="flex justify-center gap-3 pt-4">

          <button
            @click="isConfirmOpen = false"
            class="px-4 py-2 rounded-md bg-gray-200"
          >
            Cancel
          </button>

          <button
            @click="deleteVoucherConfirmed"
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
          <h3 class="text-xl font-semibold text-gray-900 border-b border-gray-200">
            {{ currentVoucher?.voucherID ? 'Edit Voucher' : 'Create New Voucher' }}
          </h3>

          <form @submit.prevent="saveVoucher" class="space-y-4">
            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Description</span>
              <input
                v-model="currentVoucher.voucherDescription"
                type="text"
                maxlength="255"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none "
                placeholder="e.g. Q4 Server Maintenance Voucher"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Bill</span>
              <select
                v-model="currentVoucher.voucherBillID"
                required
                :disabled="currentVoucher?.voucherID"
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a Bill</option>
                <option v-for="bill in bills" :key="bill.billID" :value="bill.billID">
                  {{ bill.billDescription }} ({{ formatCurrency(bill.billAmount) }})
                </option>
              </select>
            </label>

            <label class="block space-y-1">
              <span class="text-sm font-medium text-gray-700">Amount</span>
              <input
                v-model.number="currentVoucher.voucherAmount"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="w-full p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-primary focus:outline-none transition"
                placeholder="e.g. 1500.00"
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
                <span v-if="!isSubmitting">{{ currentVoucher?.voucherID ? 'Save Changes' : 'Create Voucher' }}</span>
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
