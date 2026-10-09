<template>
  <div>
    <div class="card card-custom bg-white card-stretch gutter-b">
      <div class="card-header p-6">
        <div class="col-md-6 p-0">
          <h3>{{ $t("menu.settings") }}</h3>
        </div>
      </div>
      <div class="card-body p-6 position-relative rounded-xl">
        <div class="tabs">
          <b-nav tabs small align="center">
            <b-nav-item
              to="#"
              :active="$route.hash === '#' || $route.hash === ''"
            >
              <i class="menu-icon flaticon2-settings mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.master") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#user" :active="$route.hash === '#user'">
              <i class="menu-icon flaticon2-avatar mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.user") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#unit" :active="$route.hash === '#unit'">
              <i class="menu-icon flaticon2-menu-2 mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.unit") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#vat" :active="$route.hash === '#vat'">
              <i class="menu-icon flaticon2-percentage mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.rate") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#offer" :active="$route.hash === '#offer'">
              <i class="menu-icon flaticon2-file mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.offer") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#project" :active="$route.hash === '#project'">
              <i class="menu-icon flaticon2-check-mark mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.order") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#invoice" :active="$route.hash === '#invoice'">
              <i class="menu-icon flaticon2-list mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.invoice") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#timesheet" :active="$route.hash === '#timesheet'">
              <i class="menu-icon flaticon2-chronometer mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.timesheet") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#product" :active="$route.hash === '#product'">
              <i class="menu-icon flaticon2-layers mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.product") }}
              </div>
            </b-nav-item>
            <b-nav-item to="#sharing" :active="$route.hash === '#sharing'">
              <i class="menu-icon flaticon-interface-4 mr-2"></i>
              <div class="text-capitalize">
                {{ $t("settings.sharing") }}
              </div>
            </b-nav-item>
          </b-nav>

          <div class="tab-content">
            <div
              :class="[
                'tab-pane',
                { active: $route.hash === '#' || $route.hash === '' }
              ]"
              class="p-2"
            >
              <Master v-if="$route.hash === '#' || $route.hash === ''" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#user' }]"
              class="p-2"
            >
              <User v-if="$route.hash === '#user'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#unit' }]"
              class="p-2"
            >
              <Unit v-if="$route.hash === '#unit'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#vat' }]"
              class="p-2"
            >
              <VAT v-if="$route.hash === '#vat'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#offer' }]"
              class="p-2"
            >
              <Offer v-if="$route.hash === '#offer'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#project' }]"
              class="p-2"
            >
              <Project v-if="$route.hash === '#project'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#invoice' }]"
              class="p-2"
            >
              <Invoice v-if="$route.hash === '#invoice'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#timesheet' }]"
              class="p-2"
            >
              <Timesheet v-if="$route.hash === '#timesheet'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#product' }]"
              class="p-2"
            >
              <Product v-if="$route.hash === '#product'" />
            </div>
            <div
              :class="['tab-pane', { active: $route.hash === '#sharing' }]"
              class="p-2"
            >
              <Sharing v-if="$route.hash === '#sharing'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Master from "@/view/layout/settings/Master.vue";
import User from "@/view/layout/settings/User.vue";
import Unit from "@/view/layout/settings/Unit.vue";
import VAT from "@/view/layout/settings/VAT.vue";
import Offer from "@/view/layout/settings/Offer.vue";
import Project from "@/view/layout/settings/Project.vue";
import Invoice from "@/view/layout/settings/Invoice.vue";
import Timesheet from "@/view/layout/settings/Timesheet.vue";
import Sharing from "@/view/layout/settings/Sharing.vue";
import Product from "@/view/layout/settings/Product.vue";

export default {
  name: "settings",
  metaInfo: {
    title: "Settings",
    meta: [
      { hid: "description", name: "description", content: "Settings Page" },
      {
        hid: "og:site_name",
        property: "og:site_name",
        content: "Archapp"
      },
      {
        hid: "og:title",
        property: "og:title",
        content: "Settings | Archapp"
      },
      {
        hid: "og:description",
        property: "og:description",
        content: "Settings | Archapp"
      },
      {
        hid: "og:image",
        property: "og:image",
        content: ""
      }
    ]
  },
  components: {
    Master,
    User,
    Unit,
    VAT,
    Offer,
    Project,
    Invoice,
    Timesheet,
    Sharing,
    Product
  }
};
</script>
