const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

describe('TODO API integration', () => {
  it('creates and toggles a TODO item', async () => {
    const createResponse = await request(app)
      .post('/api/items')
      .send({ name: 'Integration Toggle Item' })
      .set('Accept', 'application/json');

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.is_done).toBe(0);

    const toggleResponse = await request(app)
      .patch(`/api/items/${createResponse.body.id}`)
      .send({ isDone: true })
      .set('Accept', 'application/json');

    expect(toggleResponse.status).toBe(200);
    expect(toggleResponse.body.is_done).toBe(1);
  });

  it('reorders TODO items and returns updated order', async () => {
    const first = await request(app)
      .post('/api/items')
      .send({ name: 'Integration Reorder A' })
      .set('Accept', 'application/json');

    const second = await request(app)
      .post('/api/items')
      .send({ name: 'Integration Reorder B' })
      .set('Accept', 'application/json');

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const listResponse = await request(app).get('/api/items');
    expect(listResponse.status).toBe(200);

    const orderedIds = listResponse.body.map((item) => item.id);
    const reversedIds = [...orderedIds].reverse();

    const reorderResponse = await request(app)
      .patch('/api/items/reorder')
      .send({ orderedIds: reversedIds })
      .set('Accept', 'application/json');

    expect(reorderResponse.status).toBe(200);
    expect(reorderResponse.body.map((item) => item.id)).toEqual(reversedIds);
  });
});
