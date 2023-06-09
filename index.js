const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app= express();
const port = process.env.PORT || 5000

//set Middlewar
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5a8lj4m.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const instructorsCollection = client.db('academyDb').collection('instructors')
    const clientCollection = client.db('academyDb').collection('clientSay')
    const classCollection = client.db('academyDb').collection('class')

    app.get('/instructor', async(req, res) =>  {
        const cursor = instructorsCollection.find();
        const result = await cursor.sort({numberOfStudents : 1}).toArray();
        res.send(result);
    })

    //client
    app.get('/client', async (req, res) => {
      const result = await clientCollection.find().toArray();
      res.send(result);
    })

    //class collection
    app.post('/class', async (req, res) => {
      const classes = req.body;
      const result = await classCollection.insertOne(classes);
      res.send(result);
    })

    app.get('/class', async (req, res) => {
      const email = req.query.email;
      if(!email){
        res.send([]);
      }
      const query = {email: email}
      const result = await classCollection.find(query).toArray();
      res.send(result);
    })

    app.delete('/class/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classCollection.deleteOne(query);
      res.send(result); 
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('smash server running');
})

app.listen(port, () => {
    console.log(`the smash server is running on ${port}`)
})