require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

    const allComments = client.db("KiloByte").collection("Comments");

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
      const postData = req.body;
      const existingEntry = await wishList.findOne(postData);
      if (existingEntry) {
        return res.send({ message: "Post is already in WishList" });
      }
      const result = await wishList.insertOne(postData);
      res.send(result);
    });

    app.get("/allBlogPosts", async (req, res) => {
      const cursor = kiloByteTech.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/comments", async (req, res) => {
      const comments = req.body;
      const result = await allComments.insertOne(comments);
      res.send(result);
    });
    app.get("/comments", async (req, res) => {
      const blogId = req.query.blogId;
      let query = {
        blogId: {
          $regex: blogId,
        },
      };
      const comments = await allComments.find(query).toArray();
      res.send(comments);
    });

    app.patch("/allBlog/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          title: data?.title,
          imageUrl: data?.imageUrl,
          category: data?.category,
          longDescription: data?.longDescription,
          shortDescription: data?.shortDescription,
          postingDate: data?.postingDate,
        },
      };
      const result = await kiloByteTech.updateOne(query, update);
      res.send(result);
    });

    app.get("/wishList", async (req, res) => {
        const userEmail = req.query.email;
        if (!userEmail) {
          return res.status(400).send({ message: "Email is required" });
        }
      
        try {
          const query = { userEmail: userEmail };
          const cursor = wishList.find(query).sort({ postingDate: -1 });
          const result = await cursor.toArray();
          res.send(result);
        } catch (error) {
          res.status(500).send({ message: "Error fetching wishlist", error });
        }
      });
      

    app.delete("/wishList/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishList.deleteOne(query);
      res.send(result);
    });

    app.get("/featuredBlogPosts", async (req, res) => {
      try {
        const blogs = await kiloByteTech.find().toArray();
        blogs.forEach((blog) => {
          blog.wordCount = blog.longDescription.split(" ").length;
        });
        const topBlogs = blogs
          .sort((a, b) => b.wordCount - a.wordCount)
          .slice(0, 10);
        res.send(topBlogs);
      } catch (error) {
        console.error("Error fetching top blogs:", error);
      }
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
