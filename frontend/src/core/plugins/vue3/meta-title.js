// Replaces vue-meta for the 37 components that declare `metaInfo: { title }` (no edits to those files).
const SUFFIX = "Flexiwork";

export default {
  install(app) {
    app.mixin({
      mounted() {
        const meta = this.$options.metaInfo;
        const title = typeof meta === "function" ? meta.call(this)?.title : meta?.title;
        if (title) document.title = `${title} | ${SUFFIX}`;
      }
    });
  }
};
