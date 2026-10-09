<script lang="ts">
import Avatar from './Avatar';
export default Avatar;
</script>

<template>
  <FetchImage
    v-if="filePath"
    :filePath="filePath"
    :classNames="classNames"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :draggable="draggable"
  />
  <img 
    v-else 
    :class="classNames" 
    src="media/users/default.jpg" 
    alt="Default avatar" 
    :width="width" 
    :height="height" 
  />
</template>

<style scoped>
@import "./Avatar.scss";
</style>
