
export default defineNuxtPlugin(nuxtApp => {
  if (process.client) {
    window.global = window;
    var exports = {};
  }
})