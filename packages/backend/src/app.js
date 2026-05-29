const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    is_done INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialItems = ['Item 1', 'Item 2', 'Item 3'];
const insertStmt = db.prepare('INSERT INTO items (name, is_done, display_order) VALUES (?, ?, ?)');
const updateDoneStmt = db.prepare('UPDATE items SET is_done = ? WHERE id = ?');
const updateOrderStmt = db.prepare('UPDATE items SET display_order = ? WHERE id = ?');
const maxOrderStmt = db.prepare('SELECT COALESCE(MAX(display_order), 0) AS maxOrder FROM items');
const selectByIdStmt = db.prepare('SELECT * FROM items WHERE id = ?');
const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
const selectAllStmt = db.prepare('SELECT * FROM items ORDER BY display_order ASC, created_at DESC');

initialItems.forEach((item, index) => {
  insertStmt.run(item, 0, index + 1);
});

console.log('In-memory database initialized with sample data');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes
app.get('/api/items', (req, res) => {
  try {
    const items = selectAllStmt.all();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const { maxOrder } = maxOrderStmt.get();
    const nextOrder = Number(maxOrder) + 1;
    const result = insertStmt.run(name.trim(), 0, nextOrder);
    const id = result.lastInsertRowid;

    const newItem = selectByIdStmt.get(id);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.patch('/api/items/reorder', (req, res) => {
  try {
    const { orderedIds } = req.body || {};

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: 'orderedIds must be a non-empty array of item IDs' });
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      return res.status(400).json({ error: 'orderedIds must not contain duplicates' });
    }

    const idValues = [];
    for (const rawId of orderedIds) {
      const parsedId = Number.parseInt(rawId, 10);
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: 'orderedIds must contain only numeric item IDs' });
      }
      idValues.push(parsedId);
    }

    const currentIds = selectAllStmt.all().map((item) => item.id);

    if (currentIds.length !== idValues.length) {
      return res.status(400).json({ error: 'orderedIds must include all existing item IDs' });
    }

    const sortedCurrent = [...currentIds].sort((a, b) => a - b);
    const sortedIncoming = [...idValues].sort((a, b) => a - b);

    const hasSameMembership = sortedCurrent.every((id, index) => id === sortedIncoming[index]);
    if (!hasSameMembership) {
      return res.status(400).json({ error: 'orderedIds must include all existing item IDs' });
    }

    const reorderTransaction = db.transaction((ids) => {
      ids.forEach((itemId, index) => {
        updateOrderStmt.run(index + 1, itemId);
      });
    });

    reorderTransaction(idValues);

    return res.json(selectAllStmt.all());
  } catch (error) {
    console.error('Error reordering items:', error);
    return res.status(500).json({ error: 'Failed to reorder items' });
  }
});

app.patch('/api/items/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = selectByIdStmt.get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { isDone } = req.body || {};
    let nextIsDone;

    if (typeof isDone === 'undefined') {
      nextIsDone = existingItem.is_done === 1 ? 0 : 1;
    } else if (typeof isDone === 'boolean') {
      nextIsDone = isDone ? 1 : 0;
    } else {
      return res.status(400).json({ error: 'isDone must be a boolean when provided' });
    }

    updateDoneStmt.run(nextIsDone, id);
    const updatedItem = selectByIdStmt.get(id);

    return res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Valid item ID is required' });
    }

    const existingItem = selectByIdStmt.get(id);
    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      res.json({ message: 'Item deleted successfully', id });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = { app, db, insertStmt };