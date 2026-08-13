import jsonServer from 'json-server';
import fs from 'fs';
import path from 'path';

// Read the database from file
const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'db.json'), 'utf8'));

const server = jsonServer.create();

// Pass the object directly to router so it operates completely in-memory.
// This prevents errors on Vercel's read-only file system while allowing temporary writes!
const router = jsonServer.router(db);
const middlewares = jsonServer.defaults();

server.use(middlewares);

// Vercel routes everything to /api/..., but json-server expects /users, /projects, etc.
server.use(jsonServer.rewriter({
  '/api/*': '/$1'
}));

server.use(router);

// Export as a serverless function for Vercel
export default server;
