<script lang="ts">
import CustomerModal from "./CustomerModal";
export default CustomerModal;
</script>

<template>
  <b-modal v-model="dialog" hide-footer hide-header-close no-close-on-backdrop>
    <template #modal-title>
      <div class="customer-selector d-flex align-items-center">
        <div class="icon-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 18L1 22V6L8 2M8 18L16 22M8 18V2M16 22L23 18V2L16 6M16 22V6M16 6L8 2"
              stroke="#2884EF"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        Select Address
      </div>
    </template>
    <div class="customer-selector">
      <div>
        <div class="search-input-customer mb-5 position-relative">
          <span class="search-icon">
            <i class="fas fa-search"></i>
          </span>
          <input
            type="text"
            placeholder="Search ..."
            class="form-control search-input"
            v-model="localSearchQuery"
            @input="updateSearchQuery(localSearchQuery)"
          />
        </div>

        <!-- Customer List -->
        <div class="d-flex flex-column gap-3 customer-list">
          <div
            v-for="customer in filteredCustomers"
            :key="customer.id"
            class="customer-item"
            :class="{ selected: selectedCustomer?.id === customer.id }"
            @click="selectCustomer(customer)"
          >
            <div class="customer-radio custom-radio">
              <input type="radio" :id="'customer-' + customer.id" :value="customer" v-model="selectedCustomer" />
              <label :for="'customer-' + customer.id" class="w-100">
                <div class="customer-info d-flex flex-column gap-2">
                  <div>
                    <div class="customer-row font-weight-semibold">
                      {{ customer.company ? customer.company : customer.first_name + ", " + customer.last_name }}
                    </div>
                    <div class="customer-row">
                      {{ customer.details.address }}
                    </div>
                  </div>
                  <div class="customer-row font-weight-semibold">
                    {{ customer.details.postcode }} {{ customer.details.place }}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-12 p-0 mt-8 d-flex flex-row justify-content-between">
        <b-button variant="secondary" class="cancel-btn w-100 text-center mr-2 transparent-btn" @click="cancel">
          Cancel
        </b-button>
        <b-button variant="primary" class="save-btn w-100 text-center ml-2" style="float: right" @click="confirm">
          Confirm
        </b-button>
      </div>
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
@import "./CustomerModal.scss";
</style>
