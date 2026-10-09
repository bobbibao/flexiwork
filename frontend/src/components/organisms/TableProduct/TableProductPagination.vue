<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ERouteQueryParams, updateQueryParameter } from "@/common";
import { ButtonCustom } from "@/components/atoms";
import { ITablePagination } from "../table/type";

export default defineComponent({
  name: "TableProductPagination",
  components: {
    ButtonCustom
  },
  props: {
    pagination: {
      type: Object as PropType<ITablePagination>,
      required: true
    }
  },
  methods: {
    isFirstPage() {
      return this.pagination.currentPage === 1;
    },
    isLastPage() {
      return this.pagination.currentPage === this.pagination.totalPages || this.pagination.totalPages === 0;
    },
    handleChangePage(page: string | number) {
      if (page === "..." || +page < 1 || +page > this.pagination.totalPages || +page === this.pagination.currentPage)
        return;
      const pageTo = +page || this.pagination.currentPage;
      this.$emit("onPageChange", pageTo);
    }
  },
  computed: {
    visiblePages() {
      // Custom pagination logic for showing up to 7 pages, similar to Figma
      const pages = [];
      const maxVisiblePages = 7;

      if (this.pagination.totalPages <= maxVisiblePages) {
        for (let i = 1; i <= this.pagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (this.pagination.currentPage <= 3) {
          pages.push(1, 2, 3, 4, "...", this.pagination.totalPages);
        } else if (this.pagination.currentPage >= this.pagination.totalPages - 2) {
          pages.push(
            1,
            "...",
            this.pagination.totalPages - 3,
            this.pagination.totalPages - 2,
            this.pagination.totalPages - 1,
            this.pagination.totalPages
          );
        } else {
          pages.push(
            1,
            "...",
            this.pagination.currentPage - 1,
            this.pagination.currentPage,
            this.pagination.currentPage + 1,
            "...",
            this.pagination.totalPages
          );
        }
      }
      return pages;
    }
  }
});
</script>

<template>
  <div class="archapp-table__pagination">
    <ButtonCustom
      :text="String($t('button.previous'))"
      variant="secondary-gray"
      size="sm"
      :disabled="isFirstPage()"
      @click="handleChangePage(pagination.currentPage - 1)"
    >
      <template #start-icon>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15.8337 10.0003H4.16699M4.16699 10.0003L10.0003 15.8337M4.16699 10.0003L10.0003 4.16699"
            stroke="#344054"
            stroke-width="1.67"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </template>
    </ButtonCustom>

    <div class="d-flex">
      <ButtonCustom
        v-for="page in visiblePages"
        size="sm"
        :key="page"
        :text="page.toString()"
        :variant="pagination.currentPage === +page ? 'secondary' : 'tertiary-gray'"
        @click="handleChangePage(page)"
      >
      </ButtonCustom>
    </div>

    <ButtonCustom
      :text="String($t('button.next'))"
      variant="secondary-gray"
      size="sm"
      :disabled="isLastPage()"
      @click="handleChangePage(pagination.currentPage + 1)"
    >
      <template #end-icon>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.16699 10.0003H15.8337M15.8337 10.0003L10.0003 4.16699M15.8337 10.0003L10.0003 15.8337"
            stroke="#344054"
            stroke-width="1.67"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </template>
    </ButtonCustom>
  </div>
</template>

<style scoped></style>
