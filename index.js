require('dotenv').config()
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const app= express();
const port = process.env.PORT || 5000

//set Middlewar
app.use(cors());
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

    //user updata
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




app.listen(port, () => {
    console.log(`the smash server is running on ${port}`)
})