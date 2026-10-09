import { defineComponent } from "vue";
import {
  SelectOption,
  ContentEditor,
} from "@/components";
import ButtonCustom from "@/components/atoms/button/ButtonCustom/ButtonCustom.vue";

import { AdditionalOption } from "./type";
export default defineComponent({
    name: "AdditionalCosts",
    components: {
      ContentEditor,
      ButtonCustom
    },
    props: {
      companyName: {
        type: String,
        default: "",
      },
      selected_km_label: {
        type: String,
        default: "",
      },
      defaultKmOptions: {
        type: Array<SelectOption>,
        default: () => [],
      },
      defaultAdditionalOptions: {
        type: Array<AdditionalOption>,
        default: () => [],
      },
      additionalDesc: {
        type: String,
        default: "",
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      showAdditionalDesc: {
        type: Boolean,
        default: true,
      }
    },
    watch: {
      selected_km_label: {
        handler() {
          this.generateAddCostDesc();
        },
      },
    },
    methods: {
      generateAddCostDesc() {
        const start =
          "<p>Die Nebenkosten werden als Pauschale in Prozent der Netto-Honorarsumme (exkl. MWST) berechnet und stellen sich je nach Projekt und Notwendigkeit wie folgt zusammen:</p>";
        const end =
          "<p>Planplots werden über externe Reprografieanstalten in Auftrag gegeben und sind nicht Bestandteil der " +
          this.companyName +
          " Nebenkostenpauschale. Diese Rechnungen werden durch Plan4 kontrolliert und werden der Bauherrschaft direkt zugestellt.</p>";
        let percent = 0.0;
        let final = null;
        const selected_km_value = Number(this.defaultKmOptions.find((option: SelectOption) => option.label === this.selected_km_label)?.value);
  
        if (selected_km_value > 0) {
          const dropdownText = `<p>Fahrkilometer inkl,. Fahrzeit je nach Umkreis (U1-3)/Parkierungsspesen/Bewilligungen etc. = <strong>${selected_km_value.toFixed(
            1
          )}%&nbsp;</strong></p>`;
          const dropdownSubText =
            "<p>(Bürostandort; U1 = <strong>1.0%</strong>, Bis 10km; U2 = <strong>2.0%</strong>, über 10km; U3 = <strong>3.0%</strong>)</p>";
          final = start + dropdownText + dropdownSubText;
          percent = parseFloat(selected_km_value.toFixed(1));
        } else {
          final = start;
        }
  
        for (const item of this.defaultAdditionalOptions) {
          if (item.is_active) {
            final += "<p>" + item.label + " = <strong>" + parseFloat(item.value).toFixed(1) + "%</strong></p>";
            percent += parseFloat(item.value);
          }
        }
  
        const total = "<p><strong>Total NK: " + percent + "%</strong></p>";
        final += total;
        final += end;
        this.$emit("update:additionalDesc", final);
      },
      setKm(e: string) {
        this.$emit("update:selected_km_label", e);
      },
      setAddCost(additionalCost: AdditionalOption) {
        this.defaultAdditionalOptions.forEach(option => {
          if (option.label === additionalCost.label) {
            option.is_active = !option.is_active;
          }
          });
        this.generateAddCostDesc();
      },
      calculatedTotalPerCent() {
        let percent = 0.0;
        //handle additional cost value  
        for (let index = 0; index < this.defaultAdditionalOptions.length; index++) {
          if (this.defaultAdditionalOptions[index].is_active === true) {
            percent += parseFloat(this.defaultAdditionalOptions[index].value);
          }
        }
        //handle dropdown value
        for (let index = 0; index < this.defaultKmOptions.length; index++) {
          if (this.selected_km_label === this.defaultKmOptions[index].label) {
            percent += parseFloat(this.defaultKmOptions[index].value);
          }
        }
  
        return percent;
      },
      handleButtonClick() {
        this.$emit("addQuoteItem", this.calculatedTotalPerCent());
      },
      updateAdditionalDesc(e: string) {
        this.$emit("update:additionalDesc", e);
      }
    },
});
