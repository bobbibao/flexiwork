<script lang="ts">
import RatingDialog from "./RatingDialog";
export default RatingDialog;
</script>

<template>
  <SnModal :show="show" :title="raterRole === 'employer' ? $t('sn.rating.rateWorker') : $t('sn.rating.rateEmployer')" @close="$emit('close')">
    <div class="sn-stars text-center mb-3" role="radiogroup">
      <button v-for="n in 5" :key="n" type="button" :class="{ on: n <= stars }" :aria-label="$t('sn.rating.stars', { n })" :data-test="`star-${n}`" @click="stars = n">★</button>
    </div>
    <div class="mb-3">
      <span v-for="tag in available" :key="tag" class="sn-chip" :class="{ active: tags.includes(tag) }" @click="toggle(tag)">{{ $t(`sn.rating.tags.${tag}`) }}</span>
    </div>
    <div class="form-group">
      <label for="rating-comment">{{ $t("sn.rating.comment") }}</label>
      <textarea id="rating-comment" v-model="comment" class="form-control" rows="3" :placeholder="$t('sn.rating.commentPlaceholder')"></textarea>
    </div>
    <p v-if="error" class="text-danger">{{ error }}</p>
    <button class="btn btn-primary btn-block" :disabled="busy" data-test="rating-submit" @click="submit">{{ $t("sn.common.send") }}</button>
  </SnModal>
</template>
