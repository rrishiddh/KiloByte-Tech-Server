require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cfwc1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const kiloByteTech = client.db("KiloByte").collection("AllBlog");

    const wishList = client.db("KiloByte").collection("WishList");

    app.post("/allBlog", async (req, res) => {
      const addBlog = req.body;
      const result = await kiloByteTech.insertOne(addBlog);
      res.send(result);
    });
    app.get("/allBlog", async (req, res) => {
      const cursor = kiloByteTech.find().sort({ postingDate: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/recentBlog", async (req, res) => {
      const cursor = kiloByteTech.find().sort({ postingDate: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allBlogPost", async (req, res) => {
      const searchText = req.query.searchText;
      let query = {
        title: {
          $regex: searchText,
          $options: "i",
        },
      };
      const blogs = await kiloByteTech.find(query).toArray();
      res.send(blogs);
    });

    app.post("/wishList", async (req, res) => {
      const postWish = req.body;
      const existingEntry = await wishList.findOne(postWish);
      if (existingEntry) {
        return res.send({ message: "Post is already in WishList" });
      }
      const result = await wishList.insertOne(postWish);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server running at port: ${port}`);
});
