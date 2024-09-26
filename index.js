const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors"); // Add this line
require("dotenv").config(); // Nạp biến môi trường từ file .env

const app = express();
app.use(express.json()); // Để đọc dữ liệu JSON từ request body
app.use(
  cors({
    origin: "http://localhost:3000", // Hoặc các nguồn khác nếu cần
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
); // Enable CORS for all routes

// Khởi tạo môi trường SDK của Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // Xử lý ký tự xuống dòng
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

const db = admin.firestore();
const collection = db.collection("tree-shop-nodejs"); // Collection treeShop trong Firestore

// 1. Create a new tree: POST
app.post("/trees", async (req, res) => {
  try {
    // Dữ liệu cây cảnh nhận từ request body
    const { name, description, img } = req.body;
    const tree = { name, description, img };
    const docRef = await collection.add(tree);
    res
      .status(201)
      .send({ id: docRef.id, message: "Tree created successfully" });
  } catch (error) {
    res.status(500).send("Error creating tree: " + error.message);
  }
});

// 2. Read all trees: GET
app.get("/trees", async (req, res) => {
  try {
    console.log("Fetching trees...");
    const snapshot = await collection.get();
    console.log("Snapshot received");
    const trees = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(trees);
  } catch (error) {
    console.error("Error fetching trees:", error);
    res
      .status(500)
      .json({ error: "Error fetching trees", details: error.message });
  }
});

// 3. Read a tree by ID: GET/id
app.get("/trees/:id", async (req, res) => {
  try {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).send("Tree not found");
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).send("Error fetching tree: " + error.message);
  }
});

// 4. Update a tree by ID: PUT/id
app.put("/trees/:id", async (req, res) => {
  try {
    // Các trường mới hoặc cập nhật sẽ được lấy từ request body
    const { name, description, img } = req.body;
    const updatedTree = { name, description, img };
    await collection.doc(req.params.id).update(updatedTree);
    res.status(200).send("Tree updated successfully");
  } catch (error) {
    res.status(500).send("Error updating tree: " + error.message);
  }
});

// 5. Delete a tree by ID: DELETE/id
app.delete("/trees/:id", async (req, res) => {
  try {
    await collection.doc(req.params.id).delete();
    res.status(200).send("Tree deleted successfully");
  } catch (error) {
    res.status(500).send("Error deleting tree: " + error.message);
  }
});

// Chạy server với port online hoặc 3000 local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});