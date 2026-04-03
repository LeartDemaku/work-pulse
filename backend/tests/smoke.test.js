import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

function startServer() {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Nuk u lexua porta e serverit te testit.'));
        return;
      }

      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done, doneReject) => {
          server.close((error) => {
            if (error) {
              doneReject(error);
              return;
            }
            done();
          });
        })
      });
    });

    server.on('error', reject);
  });
}

test('GET /api/health kthen status 200 dhe payload valide', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.status, 'ok');
    assert.equal(typeof payload.now, 'string');
  } finally {
    await server.close();
  }
});

test('GET /api/applications/:id/cv pa autentikim kthen 401 (route ekziston dhe eshte e mbrojtur)', async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/applications/9/cv`);
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});
