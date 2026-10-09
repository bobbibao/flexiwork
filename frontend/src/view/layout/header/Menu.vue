<template>
  <ul class="menu-nav">
    <router-link
      v-if="currentUser.role === 'admin'"
      to="/product"
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
          <i class="menu-icon flaticon2-layers"></i>
          <span class="menu-text"> {{ $t("menu.product") }} </span>
        </a>
      </li>
    </router-link>

    <router-link
      v-if="currentUser.role === 'admin'"
      to="/settings"
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
          <i class="menu-icon flaticon2-settings"></i>
          <span class="menu-text"> {{ $t("menu.settings") }} </span>
        </a>
      </li>
    </router-link>
    <li class="menu-item">
      <div class="menu-link" @click="toggleFullScreen">
        <i class="menu-icon flaticon2-expand"></i>
        <span class="menu-text"> {{ $t("menu.fullscr") }} </span>
      </div>
    </li>
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
    },
    toggleFullScreen() {
      var elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }
    }
  }
};
</script>
