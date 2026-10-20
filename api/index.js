// Keep this entry point in Git so Vercel discovers the API before the build runs.
let appPromise;

export default async function handler(req, res) {
  try {
    appPromise ??= import('../dist/server.js').then(module => module.default);
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('API initialization failed:', error);
    appPromise = undefined;
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'The server could not start. Please try again shortly.' }));
    }
  }
}
