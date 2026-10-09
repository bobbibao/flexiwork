import { defineComponent, ref, PropType, watch } from "vue";
import { CreditCard, WalletIcon } from "@/components";
import currency from "currency.js";
import { IProjectStats } from "../../dtos";

export default defineComponent({
  name: "TotalSumProject",
  components: { CreditCard, WalletIcon },
  props: {
    projectStats: {
      type: Object as PropType<IProjectStats>,
      required: true,
      default: () => ({
        total_active_projects: 0,
        total_open_gross_amount: 0,
        total_open_net_amount: 0,
        total_project_amount: 0,
        total_remaining_amount: 0
      })
    },
  },
  setup(props) {
    const sumNet = ref<number>(0);
    const sumGross = ref<number>(0);
    const total_active_projects = ref<number>(0);
    const total_open_gross_amount = ref<number>(0);
    const total_open_net_amount = ref<number>(0);
    const total_project_amount = ref<number>(0);
    const total_remaining_amount = ref<number>(0);

    total_active_projects.value = props.projectStats.total_active_projects;
    total_open_gross_amount.value = props.projectStats.total_open_gross_amount;
    total_open_net_amount.value = props.projectStats.total_open_net_amount;
    total_project_amount.value = props.projectStats.total_project_amount;
    total_remaining_amount.value = props.projectStats.total_remaining_amount;

    watch(
      () => props.projectStats,
      newVal => {
        total_active_projects.value = newVal.total_active_projects;
        total_open_gross_amount.value = newVal.total_open_gross_amount;
        total_open_net_amount.value = newVal.total_open_net_amount;
        total_project_amount.value = newVal.total_project_amount;
        total_remaining_amount.value = newVal.total_remaining_amount;
      }
    );

    // watch(
    //   () => props.totalSumNet,
    //   newVal => {
    //     sumNet.value = newVal;
    //   }
    // );

    // watch(
    //   () => props.totalSumGross,
    //   newVal => {
    //     sumGross.value = newVal;
    //   }
    // );
    return {
      total_active_projects,
      total_open_gross_amount,
      total_open_net_amount,
      total_project_amount,
      total_remaining_amount,
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
