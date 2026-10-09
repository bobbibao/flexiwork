import { defineComponent, ref, PropType, watch } from "vue";
import { WalletIcon } from "@/components";
import { Offer } from "@/common/models/offers.model";
import currency from "currency.js";

export default defineComponent({
  name: "TotalSum",
  components: { WalletIcon },
  props: {
    totalSumNet: {
      type: Number,
      required: true
    },
    totalSumGross: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const sumNet = ref<number>(0);
    const sumGross = ref<number>(0);

    sumNet.value = props.totalSumNet;
    sumGross.value = props.totalSumGross;
    watch(
      () => props.totalSumNet,
      newVal => {
        sumNet.value = newVal;
      }
    );

    watch(
      () => props.totalSumGross,
      newVal => {
        sumGross.value = newVal;
      }
    );
    return {
      sumNet,
      sumGross,
      formatMoney(vallue: number) {
        return currency(vallue, {
          separator: "'",
          pattern: `#`,
          negativePattern: `-#`,
          increment: 0.05
        }).format();
      }
    };
  }
});
