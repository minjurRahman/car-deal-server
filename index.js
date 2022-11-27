const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());


//Connect To Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjaguop.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//CRUD operation function
async function run(){
  try{
    const categoryCollection = client.db('CarDeal').collection('category');
    const carsCollection = client.db('CarDeal').collection('cars');
    const bookingsCollection = client.db('CarDeal').collection('bookings');
    const usersCollection = client.db('CarDeal').collection('users');

    //Category 
    app.get('/category', async(req, res) =>{
      const query = {};
      const options = await categoryCollection.find(query).toArray();
      res.send(options);
    })

    //Cars
    app.get('/cars', async(req, res) =>{
      const query = {};
      const options = await carsCollection.find(query).toArray();
      res.send(options);
    })

    //get specific categories data
    app.get('/cars/:id', async (req, res) =>{
      const id = req.params.id;
      console.log(id)
      const category = req.body;

      const query = category.categoryId ;
      console.log(query)

      const display = await carsCollection.find(query).toArray();
      console.log(display)
      res.send(display);
    })

    //get specific categories data
    app.get('/category/:categoryId', async (req, res) => {
      const categoryId = req.params.categoryId;
      const query = { categoryId: parseInt(categoryId) }
      const result = await carsCollection.find(query).toArray()
      res.send(result);
      console.log(req.params.id);
  })


    //Bookings collection 
    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/bookings', async(req, res) =>{
      const email = req.query.email;
      console.log(email)
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    })


    //Users
    app.post('/users', async(req, res) =>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


    //JWT token
    app.get('/jwt', async(req, res) =>{
      const email = req.query.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      if(user){
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '7d'})
        return res.send({accessToken: token})
      }
      console.log(user);
      res.status(403).send({accessToken: ''});
    });


  }
  catch(error){
    console.log(error.name, error.message.bold, error.stack)
  }
  finally{

  }


}

run()



app.get('/', async(req, res) =>{
    res.send('Car Deal server is running');
})



app.listen(port, () => console.log(`Car Deal Server is running on ${port}`));


