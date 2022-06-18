// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler((event) => {
  console.log('New request: ' + event.req.url);
})