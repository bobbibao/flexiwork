import { defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ButtonCustom, CalendarIcon, ChevronLeft, ChevronRight, ChevronDownIcon } from "@/components";

interface DatePreset {
  label: string;
  getValue: () => { start: Date; end: Date };
}

export default defineComponent({
  name: "DateRangePicker",
  components: { ButtonCustom, CalendarIcon, ChevronLeft, ChevronRight, ChevronDownIcon },

  emits: ["dateRangeSelected"],

  setup(props, { emit }) {
    const isOpen = ref(false);
    const currentDate = new Date();
    const selectedStartDate = ref(new Date());
    const selectedEndDate = ref(new Date());
    const appliedStartDate = ref(new Date());
    const appliedEndDate = ref(new Date());
    const currentMonth = ref(currentDate.getMonth());
    const currentYear = ref(currentDate.getFullYear());
    const hasSelection = ref(false);
    const selectedPresetLabel = ref<string>("");
    const isFirstClick = ref(true);
    const monthDropdownOpen = ref(false);
    const yearDropdownOpen = ref(false);

    const presets: DatePreset[] = [
      {
        label: "timesheet.thisWeek",
        getValue: () => {
          const now = new Date();
          const start = new Date(now);
          // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          const currentDay = start.getDay();
          // Calculate days to subtract to get to Monday
          // If Sunday (0), subtract 6 days to get to previous Monday
          // If Monday (1), subtract 0 days
          // If Tuesday (2), subtract 1 day, etc.
          const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
          start.setDate(start.getDate() - daysToSubtract);
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          // Add 6 days to get to Sunday
          end.setDate(end.getDate() + 6);
          end.setHours(23, 59, 59, 999);

          return { start, end };
        }
      },
      {
        label: "timesheet.lastWeek",
        getValue: () => {
          const now = new Date();
          const start = new Date(now);
          // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          const currentDay = start.getDay();
          // Calculate days to subtract to get to last Monday
          // If Sunday (0), subtract 13 days to get to previous Monday
          // If Monday (1), subtract 7 days
          // If Tuesday (2), subtract 8 days, etc.
          const daysToSubtract = currentDay === 0 ? 13 : currentDay + 6;
          start.setDate(start.getDate() - daysToSubtract);
          start.setHours(0, 0, 0, 0);

          const end = new Date(start);
          // Add 6 days to get to Sunday
          end.setDate(end.getDate() + 6);
          end.setHours(23, 59, 59, 999);

          return { start, end };
        }
      },
      {
        label: "timesheet.thisMonth",
        getValue: () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return { start, end };
        }
      },
      {
        label: "timesheet.lastMonth",
        getValue: () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const end = new Date(now.getFullYear(), now.getMonth(), 0);
          return { start, end };
        }
      }
    ];

    // Initialize with "This week" preset
    const initializeWithThisWeek = () => {
      const thisWeekPreset = presets[0]; // "This week" is the first preset
      const { start, end } = thisWeekPreset.getValue();
      selectedStartDate.value = start;
      selectedEndDate.value = end;
      appliedStartDate.value = start;
      appliedEndDate.value = end;
      hasSelection.value = true;
      selectedPresetLabel.value = thisWeekPreset.label;

      // Emit initial date range
      emit("dateRangeSelected", {
        startDate: start,
        endDate: end
      });
    };

    // Call initialization immediately
    initializeWithThisWeek();

    const isDateInRange = (date: Date, start: Date, end: Date) => {
      // Strip time components for comparison and set to midnight
      const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const compareStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const compareEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
      // Use <= and >= to make the comparison inclusive of both start and end dates
      return compareDate >= compareStart && compareDate <= compareEnd;
    };

    const isStartDate = (date: Date, start: Date) => {
      return (
        date.getFullYear() === start.getFullYear() &&
        date.getMonth() === start.getMonth() &&
        date.getDate() === start.getDate()
      );
    };

    const isEndDate = (date: Date, end: Date) => {
      return (
        date.getFullYear() === end.getFullYear() &&
        date.getMonth() === end.getMonth() &&
        date.getDate() === end.getDate()
      );
    };

    const selectDate = (date: Date) => {
      if (isFirstClick.value) {
        // First click sets start date
        selectedStartDate.value = date;
        selectedEndDate.value = date;
        isFirstClick.value = false;
        selectedPresetLabel.value = ""; // Clear preset when manually selecting
      } else {
        // Second click sets end date
        if (date < selectedStartDate.value) {
          selectedEndDate.value = selectedStartDate.value;
          selectedStartDate.value = date;
        } else {
          selectedEndDate.value = date;
        }
        isFirstClick.value = true;
        hasSelection.value = true;
      }
    };

    const calendarDays = computed(() => {
      const firstDay = new Date(currentYear.value, currentMonth.value, 1);
      const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
      const days = [];

      // Previous month days
      let prevMonthDays = firstDay.getDay() - 1;
      if (prevMonthDays === -1) prevMonthDays = 6; // Handle Sunday case

      if (prevMonthDays > 0) {
        const prevMonth = new Date(currentYear.value, currentMonth.value - 1);
        const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate();

        for (let i = prevMonthDays - 1; i >= 0; i--) {
          const dateNum = prevMonthLastDay - i;
          const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dateNum);
          days.push({
            date: new Date(date), // Create new date instance
            type: "prev-month",
            isInRange: hasSelection.value && isDateInRange(date, selectedStartDate.value, selectedEndDate.value),
            isStartDate: hasSelection.value && isStartDate(date, selectedStartDate.value),
            isEndDate: hasSelection.value && isEndDate(date, selectedEndDate.value)
          });
        }
      }

      // Current month days
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(currentYear.value, currentMonth.value, i);
        days.push({
          date: new Date(date), // Create new date instance
          type: "current-month",
          isInRange: hasSelection.value && isDateInRange(date, selectedStartDate.value, selectedEndDate.value),
          isStartDate: hasSelection.value && isStartDate(date, selectedStartDate.value),
          isEndDate: hasSelection.value && isEndDate(date, selectedEndDate.value)
        });
      }

      // Next month days
      const remainingDays = 42 - days.length; // Always show 6 weeks
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(currentYear.value, currentMonth.value + 1, i);
        days.push({
          date: new Date(date), // Create new date instance
          type: "next-month",
          isInRange: hasSelection.value && isDateInRange(date, selectedStartDate.value, selectedEndDate.value),
          isStartDate: hasSelection.value && isStartDate(date, selectedStartDate.value),
          isEndDate: hasSelection.value && isEndDate(date, selectedEndDate.value)
        });
      }

      return days;
    });

    const monthName = computed(() => {
      return new Date(currentYear.value, currentMonth.value).toLocaleString("default", { month: "long" });
    });

    const months = computed(() => {
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(2000, i, 1);
        return {
          value: i,
          label: date.toLocaleString("default", { month: "long" })
        };
      });
    });

    const years = computed(() => {
      const currentYearValue = new Date().getFullYear();
      const startYear = currentYearValue - 2;
      const endYear = currentYearValue + 1;
      return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
    });

    const toggleMonthDropdown = async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Close the year dropdown if open
      yearDropdownOpen.value = false;
      
      // Toggle month dropdown
      monthDropdownOpen.value = !monthDropdownOpen.value;
      
      if (monthDropdownOpen.value) {
        // Wait for the DOM to update
        await nextTick();
        
        // Position the dropdown relative to the trigger
        const trigger = (event.target as HTMLElement).closest('.dropdown-trigger');
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          const dropdownMenu = document.querySelector('.month-dropdown') as HTMLElement;
          if (dropdownMenu) {
            dropdownMenu.style.top = `${rect.bottom}px`;
            dropdownMenu.style.left = `${rect.left}px`;
          }
        }
      }
    };

    const toggleYearDropdown = async (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Close the month dropdown if open
      monthDropdownOpen.value = false;
      
      // Toggle year dropdown
      yearDropdownOpen.value = !yearDropdownOpen.value;
      
      if (yearDropdownOpen.value) {
        // Wait for the DOM to update
        await nextTick();
        
        // Position the dropdown relative to the trigger
        const trigger = (event.target as HTMLElement).closest('.dropdown-trigger');
        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          const dropdownMenu = document.querySelector('.year-dropdown') as HTMLElement;
          if (dropdownMenu) {
            dropdownMenu.style.top = `${rect.bottom}px`;
            dropdownMenu.style.left = `${rect.left}px`;
          }
        }
      }
    };

    const selectMonth = (month: number) => {
      currentMonth.value = month;
      monthDropdownOpen.value = false;
    };

    const selectYear = (year: number) => {
      currentYear.value = year;
      yearDropdownOpen.value = false;
    };

    const selectPreset = (preset: DatePreset) => {
      const { start, end } = preset.getValue();
      selectedStartDate.value = start;
      selectedEndDate.value = end;
      hasSelection.value = true;
      selectedPresetLabel.value = preset.label;

      // Navigate to the month containing the start date
      currentMonth.value = start.getMonth();
      currentYear.value = start.getFullYear();
    };

    const navigateMonth = (delta: number) => {
      const newDate = new Date(currentYear.value, currentMonth.value + delta);
      currentMonth.value = newDate.getMonth();
      currentYear.value = newDate.getFullYear();
    };

    const toggleDatePicker = () => {
      isOpen.value = !isOpen.value;
    };

    const applyDateRange = () => {
      if (hasSelection.value) {
        appliedStartDate.value = new Date(selectedStartDate.value);
        // Set the end date to end of day (23:59:59) to include the full last day
        appliedEndDate.value = new Date(selectedEndDate.value);
        appliedEndDate.value.setHours(23, 59, 59, 999);

        emit("dateRangeSelected", {
          startDate: appliedStartDate.value,
          endDate: appliedEndDate.value
        });
      }
      toggleDatePicker();
    };

    const formatDateRange = computed(() => {
      if (!hasSelection.value) {
        return "Select Dates";
      }

      const startMonth = appliedStartDate.value.getMonth() + 1; // getMonth() is 0-indexed
      const endMonth = appliedEndDate.value.getMonth() + 1;
      const startDay = appliedStartDate.value.getDate();
      const endDay = appliedEndDate.value.getDate();
      const startYear = appliedStartDate.value.getFullYear();
      const endYear = appliedEndDate.value.getFullYear();

      // If same date, show only one date
      if (startDay === endDay && startMonth === endMonth && startYear === endYear) {
        return `${startMonth}/${startDay}`;
      }

      // If same month, only show month once
      if (startMonth === endMonth && startYear === endYear) {
        return `${startMonth}/${startDay} - ${startMonth}/${endDay}`;
      }

      // Different months, show both
      return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
    });

    const hasDateRange = computed(() => {
      return selectedStartDate.value.getTime() !== selectedEndDate.value.getTime();
    });

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.month-selector') && !target.closest('.year-selector')) {
        monthDropdownOpen.value = false;
        yearDropdownOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isOpen,
      currentMonth,
      currentYear,
      monthName,
      calendarDays,
      presets,
      selectedStartDate,
      selectedEndDate,
      appliedStartDate,
      appliedEndDate,
      formatDateRange,
      selectPreset,
      navigateMonth,
      toggleDatePicker,
      hasSelection,
      selectedPresetLabel,
      applyDateRange,
      selectDate,
      isFirstClick,
      hasDateRange,
      monthDropdownOpen,
      yearDropdownOpen,
      months,
      years,
      toggleMonthDropdown,
      toggleYearDropdown,
      selectMonth,
      selectYear,
      handleClickOutside
    };
  }
});
