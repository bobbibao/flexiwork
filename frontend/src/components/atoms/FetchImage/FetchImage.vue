<script setup lang="ts">
import { defineProps, onMounted, ref } from "vue";
import { fetchImage, toNumber } from "../../../common";

interface Props {
  filePath: string;
  classNames?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  loading?: "lazy" | "eager";
  draggable?: boolean;
}
let { filePath, classNames, alt, width, height, loading, draggable } = defineProps<Props>();

// Handle inputs
const imgBuffer = ref("");
const imgClassNames = ref(classNames || "");
const imgAlt = ref(alt || `Image from ${filePath}`);
const imgWidth = ref(width ? toNumber(width) : "auto");
const imgHeight = ref(height ? toNumber(height) : "auto");
const imgLoading = ref(loading || "eager");
const imgDraggable = ref(draggable || true);

onMounted(async () => {
  imgBuffer.value = "media/users/default.jpg";
  const getImage = await fetchImage(filePath);
  getImage && (imgBuffer.value = getImage);
});
</script>

<template>
  <img
    :class="imgClassNames"
    :src="imgBuffer"
    :alt="imgAlt"
    :width="imgWidth"
    :height="imgHeight"
    :loading="imgLoading"
    :draggable="imgDraggable"
  />
</template>
