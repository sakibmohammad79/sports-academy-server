require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');
const cors = require('cors');
const app= express();
const port = process.env.PORT || 5000


//set Middlewar
const corsConfig = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
  app.use(cors(corsConfig))
app.use(express.json());


const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if(err){
      return res.status(401).send({error: true, message: 'unathorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5a8lj4m.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const dbConnect = async () => {
  try {
    client.connect();
    console.log(" Database Connected Successfully✅ ");

  } catch (error) {
    console.log(error.name, error.message);
  }
}
dbConnect()

    const instructorsCollection = client.db('academyDb').collection('instructors')
    const clientCollection = client.db('academyDb').collection('clientSay')
    const classCollection = client.db('academyDb').collection('class')
    const usersCollection = client.db('academyDb').collection('users')
    const instructorClassCollection = client.db('academyDb').collection('instructorClass')
    const paymentCollection = client.db('academyDb').collection('payments')
    const enrollClassCollection = client.db('academyDb').collection('enrollClass')
    


    app.get('/', (req, res) => {
      res.send('smash server running');
  })
    //JWT
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {expiresIn: 
        '1h'})
        res.send({token});
    })


    //user verfyJwt before using verifyadmin
    const verifyadmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email}
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin') {
        return res.status(403).send({error: true, message: 'forbidden access admin'})
      }
      next();
    }

    app.get('/instructor', async(req, res) =>  {
        const cursor = instructorsCollection.find();
        const result = await cursor.sort({numberOfStudents : 1}).toArray();
        res.send(result);
    })



    app.get('/instructorclass', async(req, res) =>  {
        const result = await instructorClassCollection.find().toArray()
        res.send(result);
    })

    app.get('/instructorclass/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email }
      const result = await instructorClassCollection.find(query).toArray();
      res.send(result);
    })
    

    //add class
    app.post('/instructorclass', verifyJwt,  async(req, res) => {
      const newClass = req.body;
      const result = await instructorClassCollection.insertOne(newClass);
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

    app.get('/class', verifyJwt, async (req, res) => {
      const email = req.query.email;
      if(!email){
        res.send([]);
      }
      const decodedEmail = req.decoded.email;
      if(email !== decodedEmail){
        return res.status(401).send({error: true, message: 'forbidden  access'})
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

    //user post related api
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if(existingUser){
        return res.send({message: "user already exist"})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    } )

    //user get
    app.get('/users', verifyJwt, verifyadmin, async (req, res)=> {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    //check admin
    app.get('/users/admin/:email', verifyJwt, async (req, res) => {
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin: false})
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query);
      const result = {admin: user?.role === 'admin'}
      res.send(result);
    })


    //user admin updata
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    //user deeleted
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query);
      res.send(result); 
    })


    //instructor updata
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          role: 'instructor'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result);
    })


    //check instructor
    app.get('/users/instructor/:email', verifyJwt, async (req, res) => {
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({instructor: false})
      }

      const query = {email: email}
      const user = await usersCollection.findOne(query);
      const result = {instructor: user?.role === 'instructor'}
      res.send(result);
    })

    //create payment intent
    app.post("/create-payment-intent", verifyJwt, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price*100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card'],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //payment related api
    app.post('/payments/:id', verifyJwt, async(req, res) =>  {
      const payment = req.body;
      const id = req.params.id;
      const insertResult = await paymentCollection.insertOne(payment);
      
      // const query = {_id: {$in: payment.cartItems.map(id => new ObjectId(id))}}
      const query = {_id: new ObjectId(id)}
      const deleteResult = await classCollection.deleteOne(query)

      res.send({insertResult, deleteResult});
    })

    app.get('/payments/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/enrollclass', async (req, res) => {
      const enrollClass = req.body;
      const result = await enrollClassCollection.insertOne(enrollClass);
      res.send(result);
    })

app.listen(port, () => {
    console.log(`the sports server is running on ${port}`)
})