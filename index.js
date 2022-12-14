const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Connect To Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bjaguop.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//Verify JWT
function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send('Unauthorized Access');
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
    console.log(err, decoded, process.env.ACCESS_TOKEN)
    if(err){
      return res.status(403).send({message: 'Forbidden Access'})
    }

    req.decoded = decoded;
    next();
  })

}

//CRUD operation function
async function run(){
  try{
    const categoryCollection = client.db('CarDeal').collection('category');
    const carsCollection = client.db('CarDeal').collection('cars');
    const bookingsCollection = client.db('CarDeal').collection('bookings');
    const usersCollection = client.db('CarDeal').collection('users');
    const sellersCarCollection = client.db('CarDeal').collection('sellersCar');
    const paymentsCollection = client.db('CarDeal').collection('payments');

    //Verify Admin 
    const verifyAdmin = async (req, res, next) =>{
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if(user?.role !== 'admin' ){
        return res.status(403).send({message: 'Forbidden Access'})
      }
      next();
    }
    //Verify Seller
    const verifySeller = async (req, res, next) =>{
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if(user?.status !== 'seller' ){
        return res.status(403).send({message: 'Forbidden Access'})
      }
      next();
    }

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
    app.get('/cars/:categoryName', async (req, res) =>{
      const categoryId = req.params.categoryName;
      const query = { categoryName }
      const result = await carsCollection.find(query).toArray()
      res.send(result);
      console.log(req.params.id);
    })

    //get specific categories data
    app.get('/category/:categoryId', async (req, res) => {
      const categoryId = req.params.categoryId;
      const query = { categoryId: categoryId }
      const result = await carsCollection.find(query).toArray()
      res.send(result);
      console.log(req.params.id);
  })

  //post cars by seller
  app.post('/cars', verifyJWT, async(req, res) =>{
    const cars = req.body;
    const result = await carsCollection.insertOne(cars);
    res.send(result);
  })

    //Bookings collection 
    app.post('/bookings', async(req, res) =>{
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/bookings', async(req, res) =>{
      const email = req.query.email;
      const query = { BuyerEmail: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    })

    //get specific booking data
    app.get('/bookings/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    })

    //Users
    app.post('/users', async(req, res) =>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    }) 

    app.get('/users', async(req, res) =>{
      const query = {};
      const users = await usersCollection.find(query).toArray()
      res.send(users);
    })

    app.put('/users/admin/:id', verifyJWT, verifyAdmin, async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result);

    })

    app.put('/users/seller/:id', verifyJWT, verifySeller, async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: 'seller'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result);

    })

    app.get('/users/sellers/:email', async(req, res) =>{
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      console.log(user)
      res.send({isSeller: user?.status === 'seller'});
    })

    app.get('/users/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.role === 'admin'});
    })

    //Sellers Car
    app.post('/sellersCar', verifyJWT, verifySeller, async(req, res) =>{
      const cars = req.body;
      const result = await sellersCarCollection.insertOne(cars);
      res.send(result);
    })

    app.get('/sellersCar', verifyJWT, verifySeller, async(req, res) =>{
      const email = req.query.email;
      const query = { email: email };
      const sellers = await sellersCarCollection.find(query).toArray();
      res.send(sellers);
    })
    
    app.delete('/sellersCar/:id', verifyJWT, verifySeller, async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await sellersCarCollection.deleteOne(filter);
      res.send(result);
    })

    //get specific sellers car data
    app.get('/sellersCar/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const sellerCar = await sellersCarCollection.findOne(query);
      res.send(sellerCar);
    })

    //Payment method/ Stripe
    app.post('/create-payment-intent', async(req, res) =>{
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        "payment_method_types": [
          "card"
        ]

      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });

    })

    //Payment Collection stored and get
    app.post('/payments', async(req, res) =>{
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) }
      const updatedDoc ={
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }
      const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
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


