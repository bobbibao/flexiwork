<script lang="ts">
import SnLocationsPage from "./Locations";
export default SnLocationsPage;
</script>

<template>
  <div>
    <div class="sn-row mb-3">
      <h1 class="sn-page-title">{{ $t("sn.profile.locationsTitle") }}</h1>
      <button class="btn btn-primary" data-test="add-location" @click="startNew">{{ $t("sn.profile.addLocation") }}</button>
    </div>
    <SnAlert :message="error" />
    <SnAlert :message="message" variant="success" />

    <form v-if="editing" class="sn-card sn-form" data-test="location-form" @submit.prevent="save">
      <div class="form-group">
        <label for="loc-name">{{ $t("sn.profile.locationName") }}</label>
        <input id="loc-name" v-model="form.name" class="form-control" required />
      </div>
      <div class="form-group">
        <label for="loc-address">{{ $t("sn.common.address") }}</label>
        <input id="loc-address" v-model="form.address" class="form-control" />
      </div>
      <div class="form-row">
        <div class="form-group col-6">
          <label for="loc-lat">{{ $t("sn.common.latitude") }}</label>
          <input id="loc-lat" v-model="form.lat" type="number" step="0.000001" class="form-control" required />
        </div>
        <div class="form-group col-6">
          <label for="loc-lng">{{ $t("sn.common.longitude") }}</label>
          <input id="loc-lng" v-model="form.lng" type="number" step="0.000001" class="form-control" required />
        </div>
      </div>
      <button type="button" class="btn btn-light-primary btn-sm mb-4" @click="useMyLocation"><i class="la la-crosshairs"></i> {{ $t("sn.common.useMyLocation") }}</button>
      <div class="form-group">
        <label for="loc-radius">{{ $t("sn.profile.geofence") }}</label>
        <input id="loc-radius" v-model="form.geofence_radius_m" type="number" min="20" max="2000" class="form-control" />
      </div>
      <label class="d-flex align-items-center mb-3"><input v-model="form.qr_required" type="checkbox" class="mr-2" /> {{ $t("sn.profile.qrRequired") }}</label>
      <label class="d-flex align-items-center mb-4"><input v-model="form.active" type="checkbox" class="mr-2" /> {{ $t("sn.profile.active") }}</label>
      <div class="sn-actions">
        <button class="btn btn-primary" :disabled="busy" data-test="save-location">{{ busy ? $t("sn.common.saving") : $t("sn.common.save") }}</button>
        <button type="button" class="btn btn-light" @click="editing = false">{{ $t("sn.common.cancel") }}</button>
      </div>
    </form>

    <div v-if="!locations.length && !editing" class="sn-card sn-empty">{{ $t("sn.profile.noLocations") }}</div>
    <div v-for="l in locations" :key="l.id" class="sn-card" data-test="location-item">
      <div class="sn-row">
        <div>
          <div class="font-weight-bold">{{ l.name }}</div>
          <div class="sn-muted">{{ l.address || `${l.lat}, ${l.lng}` }}</div>
          <div class="sn-muted">{{ $t("sn.profile.geofence") }}: {{ l.geofence_radius_m }} · {{ l.active ? $t("sn.profile.active") : $t("sn.profile.inactive") }}</div>
        </div>
        <div class="d-flex" style="gap: 6px">
          <button class="btn btn-sm btn-light-primary" @click="qrFor = l">{{ $t("sn.shift.showQr") }}</button>
          <button class="btn btn-sm btn-light" @click="startEdit(l)">{{ $t("sn.common.edit") }}</button>
        </div>
      </div>
    </div>

    <SnModal :show="!!qrFor" :title="qrFor ? `${$t('sn.shift.showQr')}: ${qrFor.name}` : ''" @close="qrFor = null">
      <LocationQr v-if="qrFor" :location-id="qrFor.id" />
    </SnModal>
  </div>
</template>
