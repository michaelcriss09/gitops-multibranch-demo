import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('responde 200 con status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('mi-app');
  });
});

describe('GET /', () => {
  it('responde 200 con mensaje de bienvenida', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/mi-app/i);
  });
});

describe('GET /api/greeting', () => {
  it('usa "mundo" por defecto', async () => {
    const res = await request(app).get('/api/greeting');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hola, mundo!');
  });

  it('usa el query param name si se envia', async () => {
    const res = await request(app).get('/api/greeting?name=Michael');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hola, Michael!');
  });
});
