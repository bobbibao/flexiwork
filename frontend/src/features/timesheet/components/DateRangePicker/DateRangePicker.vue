<script lang="ts">
import DateRangePicker from "./DateRangePicker";

export default DateRangePicker;
</script>

<template>
  <div class="date-picker-container">
    <ButtonCustom @click="toggleDatePicker" :text="formatDateRange" :variant="'secondary-gray'">
      <template #start-icon>
        <CalendarIcon />
      </template>
    </ButtonCustom>

    <div v-if="isOpen" class="date-picker-modal">
      <div class="date-picker" :class="{ 'has-range': hasDateRange }">
        <div class="preset-options">
          <div
            v-for="(preset, index) in presets"
            :key="index"
            class="preset-option"
            :class="{ 'preset-selected': preset.label === selectedPresetLabel }"
            @click="selectPreset(preset)"
          >
            {{ $t(preset.label) }}
          </div>
        </div>

        <div class="calendar-section">
          <div class="month-navigation">
            <button class="nav-button" @click="navigateMonth(-1)"><ChevronLeft /></button>
            <div class="date-selector-container">
              <div class="month-selector">
                <div class="dropdown-trigger" @click.stop="toggleMonthDropdown">
                  <span>{{ monthName }}</span>
                  <ChevronDownIcon class="dropdown-icon" :class="{ rotated: monthDropdownOpen }" />
                </div>
                <Teleport to="body" v-if="monthDropdownOpen">
                  <div class="dropdown-menu1 month-dropdown" style="position: fixed;">
                    <div
                      v-for="month in months"
                      :key="month.value"
                      class="dropdown-item"
                      :class="{ active: month.value === currentMonth }"
                      @click.stop="selectMonth(month.value)"
                    >
                      {{ month.label }}
                    </div>
                  </div>
                </Teleport>
              </div>
              <div class="month-selector year-selector">
                <div class="dropdown-trigger" @click.stop="toggleYearDropdown">
                  <span>{{ currentYear }}</span>
                  <ChevronDownIcon class="dropdown-icon" :class="{ rotated: yearDropdownOpen }" />
                </div>
                <Teleport to="body" v-if="yearDropdownOpen">
                  <div class="dropdown-menu1 year-dropdown" style="position: fixed;">
                    <div
                      v-for="year in years"
                      :key="year"
                      class="dropdown-item"
                      :class="{ active: year === currentYear }"
                      @click.stop="selectYear(year)"
                    >
                      {{ year }}
                    </div>
                  </div>
                </Teleport>
              </div>
            </div>
            <button class="nav-button" @click="navigateMonth(1)"><ChevronRight /></button>
          </div>

          <div class="calendar-grid">
            <div class="weekday" v-for="day in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']" :key="day">
              {{ day }}
            </div>

            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="day"
              :class="{
                'prev-month': day.type === 'prev-month',
                'next-month': day.type === 'next-month',
                'in-range': day.isInRange,
                'start-date': day.isStartDate,
                'end-date': day.isEndDate
              }"
              @click="selectDate(day.date)"
            >
              {{ day.date.getDate() }}
            </div>
          </div>

          <div class="action-buttons">
            <ButtonCustom
              :text="$t('button.cancel')"
              :variant="'secondary-gray'"
              @click="toggleDatePicker"
              :size="'md'"
            ></ButtonCustom>
            <ButtonCustom
              :text="$t('button.apply')"
              :variant="'primary'"
              @click="applyDateRange"
              :size="'md'"
            ></ButtonCustom>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "./DateRangePicker.scss";
</style>
