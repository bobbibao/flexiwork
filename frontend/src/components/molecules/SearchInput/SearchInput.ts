import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "SearchInput",
  setup() {
    const searchInput = ref<HTMLInputElement | null>(null);
    const debounceTimeout = ref<number | null>(null);
    const previousValue = ref<string>("");

    const debounce = (func: () => void, delay: number) => {
      if (debounceTimeout.value) {
        clearTimeout(debounceTimeout.value);
      }
      debounceTimeout.value = window.setTimeout(() => {
        if (previousValue.value !== searchInput.value!.value) {
          previousValue.value = searchInput.value!.value;
          func();
        }
      }, delay);
    };

    return {
      searchInput,
      debounce,
      previousValue
    };
  },
  emits: {
    onSearch(value: string) {}
  },
  methods: {
    onSearch() {
      if (this.searchInput) {
        this.debounce(() => {
          this.$emit("onSearch", this.searchInput!.value);
        }, 300);
      }
    }
  }
});
