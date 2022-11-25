const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

    app.get('/category', async(req, res) =>{
      const query = {};
      const options = await categoryCollection.find(query).toArray();
      res.send(options);
    })

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


