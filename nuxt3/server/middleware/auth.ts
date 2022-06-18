// https://v3.nuxtjs.org/guide/features/server-routes
export default defineEventHandler((event) => {
  if (event.req.url === '/') {
    event.res.writeHead(302, {
      Location: 'https://quartz.auth.ap-northeast-1.amazoncognito.com/login?client_id=bo73u1ihm98ttrqe5dfkolq7d&redirect_uri=http://localhost:3000&response_type=code'
    });
    event.res.end();
  }
})