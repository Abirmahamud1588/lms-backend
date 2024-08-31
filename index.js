const express = require("express");
const app = express();
const cors = require("cors");

const jwt = require("jsonwebtoken");

require("dotenv").config();

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access2" });
    }
    req.decoded = decoded;
    next();
  });
};
//yR5g1ahxlIfsDZlH  abirmahamu1998

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v6gvt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const userscollection = client.db("leavems").collection("users");
    const leaveRequestsCollection = client
      .db("leavems")
      .collection("leaveRequests");

    //jwt token
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // use verifyJWT before using verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userscollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    //users fetching  -    app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {

    app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {
      const result = await userscollection.find().toArray();
      res.send(result);
    });
    //users uploading
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userscollection.insertOne(user);
      res.send(result);
    });

    //admin email -security :verifyJwt
    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({ admin: false });
      }
      const query = { email: email };
      const user = await userscollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    //userd el
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userscollection.deleteOne(query);
      res.send(result);
    });
    //admin making
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedocs = {
        $set: {
          role: "admin",
        },
      };
      const result = await userscollection.updateOne(filter, updatedocs);
      res.send(result);
    });
    //leav updating
    app.patch(
      "/leaverequests/:id",
      verifyJwt,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updatedocs = {
          $set: {
            status: status,
          },
        };
        const result = await leaveRequestsCollection.updateOne(
          filter,
          updatedocs
        );
        res.send(result);
      }
    );
    // Submit a leave request
    app.post("/leaverequests", verifyJwt, async (req, res) => {
      const leaveRequest = req.body;
      leaveRequest.email = req.decoded.email;
      leaveRequest.status = "pending";
      const result = await leaveRequestsCollection.insertOne(leaveRequest);
      res.send(result);
    });

    // Get all leave requests (Admin only)
    app.get("/leaverequests", async (req, res) => {
      const result = await leaveRequestsCollection.find().toArray();
      res.send(result);
    });

    //request history
    app.get("/myrequest", verifyJwt, async (req, res) => {
      try {
        const email = req.decoded.email;
        const userreq = await leaveRequestsCollection.find({ email }).toArray();
        res.send(userreq);
      } catch (error) {
        console.error("Error fetching req history:", error);
        res
          .status(500)
          .send({ error: true, message: "Error fetching req history" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
  res.send("bosssdfdfsdfsdfd");
});

app.listen(port, () => {
  console.log("server is running");
});
