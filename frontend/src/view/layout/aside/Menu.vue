<template>
  <ul class="menu-nav">
    <router-link
      v-if="currentUser.role === 'admin'"
      to="/dashboard"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon-squares"></i>
          <span class="menu-text">{{ $t("menu.dashboard") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/task"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon-list"></i>
          <span class="menu-text">{{ $t("menu.task") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/address"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon-placeholder-3"></i>
          <span class="menu-text">{{ $t("menu.addresses") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/offer"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-checking"></i>
          <span class="menu-text">{{ $t("menu.offers") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/project"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-infographic"></i>
          <span class="menu-text">{{ $t("menu.projects") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/invoice"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-list"></i>
          <span class="menu-text">{{ $t("menu.invoices") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      to="/timesheet"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-chronometer"></i>
          <span class="menu-text">{{ $t("menu.timesheet") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role !== 'employee'"
      to="/time-overview"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon-dashboard"></i>
          <span class="menu-text">{{ $t("menu.timeOverview") }}</span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/report"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-analytics-1"></i>
          <span class="menu-text">{{ $t("menu.report") }}</span>
        </a>
      </li>
    </router-link>
  </ul>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "KTMenu",
  computed: {
    ...mapGetters(["currentUser"])
  },
  methods: {
    hasActiveChildren(match) {
      return this.$route["path"].indexOf(match) !== -1;
    }
  }
};
</script>
