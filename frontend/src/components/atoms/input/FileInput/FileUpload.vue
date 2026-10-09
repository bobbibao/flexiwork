<template>
  <div>
    <input type="file" :id="id" multiple @change="handleFileUpload" class="file-upload-input" />
    <button type="button" class="icon-button" @click="triggerFileInput">
      <i class="fa fa-link"></i>
    </button>

  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'IconFileUpload',
  props: {
    files: {
      type: Array as PropType<File[]>,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  emits: ['update:files'],
  methods: {
    handleFileUpload(event: Event) {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        const newFiles = Array.from(target.files);
        this.$emit('update:files', newFiles);
      }
    },
    triggerFileInput() {
      const fileInput = document.getElementById(this.id) as HTMLInputElement;
      fileInput.click();
    }
  }
});
</script>

<style scoped>
.file-upload-input {
  display: none;
  /* Hidden by default */
}

.icon-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  /* Adjust size as needed */
  color: #777;
  /* Adjust color as needed */
}

.icon-button:hover {
  color: #555;
  /* Change color on hover if needed */
}

.selected-files {
  margin-top: 10px;
  font-size: 0.9rem;
  /* Adjust font size as needed */
}
</style>
