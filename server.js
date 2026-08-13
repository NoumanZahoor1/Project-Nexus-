import jsonServer from 'json-server';

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Use default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom route rewrites if necessary here
// server.use(jsonServer.rewriter({ '/api/*': '/$1' }))

server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
