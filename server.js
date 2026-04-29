const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves complaints.html

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cluster0.ozmxva5.mongodb.ne=Cluster0';
const PORT = process.env.PORT || 8080;

let db;

async function connect() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db('helloworld');
  console.log('✅ Connected to MongoDB');
}

// POST /api/complaints — save a new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { email, category, complaint } = req.body;

    if (!email || !complaint) {
      return res.status(400).json({ error: 'Email and complaint are required' });
    }

    const doc = {
      email,
      category: category || 'General',
      complaint,
      createdAt: new Date()
    };

    await db.collection('complaints').insertOne(doc);
    res.status(201).json({ message: 'Complaint saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints — fetch all complaints (newest first)
app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await db.collection('complaints')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(complaints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve the HTML frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'complaints.html'));
});

connect().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});
