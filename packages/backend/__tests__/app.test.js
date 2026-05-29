const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createItem = async (name = 'Temp Item to Delete') => {
  const response = await request(app)
    .post('/api/items')
    .send({ name })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return backend health status', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', message: 'Backend server is running' });
    });
  });

  describe('GET /api/items', () => {
    it('should return all items', async () => {
      const response = await request(app).get('/api/items');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check if items have the expected structure
      const item = response.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('is_done');
      expect(item).toHaveProperty('display_order');
      expect(item).toHaveProperty('created_at');
    });
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const newItem = { name: 'Test Item' };
      const response = await request(app)
        .post('/api/items')
        .send(newItem)
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.is_done).toBe(0);
      expect(response.body).toHaveProperty('display_order');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/items')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Item name is required');
    });
  });

  describe('PATCH /api/items/:id', () => {
    it('should return 400 for invalid item id', async () => {
      const response = await request(app).patch('/api/items/not-a-number').send({ isDone: true });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).patch('/api/items/999999').send({ isDone: true });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should toggle an item when isDone is omitted', async () => {
      const item = await createItem('Item to Toggle Without Payload');

      const response = await request(app).patch(`/api/items/${item.id}`).send({});
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(item.id);
      expect(response.body.is_done).toBe(1);

      const secondResponse = await request(app).patch(`/api/items/${item.id}`).send({});
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.is_done).toBe(0);
    });

    it('should update completion state when isDone is provided', async () => {
      const item = await createItem('Item to Set Done');

      const doneResponse = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ isDone: true });

      expect(doneResponse.status).toBe(200);
      expect(doneResponse.body.is_done).toBe(1);

      const undoneResponse = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ isDone: false });

      expect(undoneResponse.status).toBe(200);
      expect(undoneResponse.body.is_done).toBe(0);
    });

    it('should return 400 when isDone is invalid', async () => {
      const item = await createItem('Item with Invalid Done Payload');

      const response = await request(app)
        .patch(`/api/items/${item.id}`)
        .send({ isDone: 'yes' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'isDone must be a boolean when provided');
    });
  });

  describe('PATCH /api/items/reorder', () => {
    it('should return 400 when orderedIds is empty', async () => {
      const response = await request(app)
        .patch('/api/items/reorder')
        .send({ orderedIds: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'orderedIds must be a non-empty array of item IDs');
    });

    it('should return 400 when orderedIds has duplicates', async () => {
      const allItemsResponse = await request(app).get('/api/items');
      expect(allItemsResponse.status).toBe(200);

      const firstId = allItemsResponse.body[0].id;
      const response = await request(app)
        .patch('/api/items/reorder')
        .send({ orderedIds: [firstId, firstId] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'orderedIds must not contain duplicates');
    });

    it('should return 400 when orderedIds contains non-numeric values', async () => {
      const allItemsResponse = await request(app).get('/api/items');
      expect(allItemsResponse.status).toBe(200);

      const existingIds = allItemsResponse.body.map((item) => item.id);
      const withBadId = [...existingIds.slice(1), 'bad-id'];

      const response = await request(app)
        .patch('/api/items/reorder')
        .send({ orderedIds: withBadId });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'orderedIds must contain only numeric item IDs');
    });

    it('should reorder items when all IDs are provided', async () => {
      const allItemsResponse = await request(app).get('/api/items');
      expect(allItemsResponse.status).toBe(200);

      const originalIds = allItemsResponse.body.map((item) => item.id);
      const reorderedIds = [...originalIds].reverse();

      const response = await request(app)
        .patch('/api/items/reorder')
        .send({ orderedIds: reorderedIds });

      expect(response.status).toBe(200);
      expect(response.body.map((item) => item.id)).toEqual(reorderedIds);
    });

    it('should return 400 when orderedIds does not include all existing IDs', async () => {
      const allItemsResponse = await request(app).get('/api/items');
      expect(allItemsResponse.status).toBe(200);

      const partial = allItemsResponse.body.slice(0, 2).map((item) => item.id);
      const response = await request(app)
        .patch('/api/items/reorder')
        .send({ orderedIds: partial });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'orderedIds must include all existing item IDs');
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete an existing item', async () => {
      const item = await createItem('Item To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Item deleted successfully', id: item.id });

      const deleteAgain = await request(app).delete(`/api/items/${item.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 404 when item does not exist', async () => {
      const response = await request(app).delete('/api/items/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Item not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/items/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid item ID is required');
    });
  });
});