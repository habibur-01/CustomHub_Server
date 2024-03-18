const express = require('express')
const cors = require('cors')
require('dotenv').config()
const stripe=require("stripe")(process.env.STRIPE_TEST_KEY)
const app = express()
const port = process.env.PORT  || 3000

// Middleware
app.use(cors({
    origin:[
        'http://localhost:5173'
    ],
    credentials:true
}))
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cbqlcas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        // create database
        const userCollection =  client.db("ContestHub").collection("users")
        const contestCollection =  client.db("ContestHub").collection("totalContest")
        const participantCollection= client.db("ContestHub").collection("participants")
       

        app.post("/users", async(req, res) => {
            const user = req.body
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        
        app.get("/users", async(req, res ) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        // get contest data
        app.get("/contest", async(req, res) => {
            const result = await contestCollection.find().toArray()
            res.send(result)
        })

        // payment_intent
        app.post('/create-payment-inten', async(req, res)=> {
            const {price} = req.body
            const amount = parseInt(price*100)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types:['card']
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
                
              });
              res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })

        // send contest register user data
        app.post('/payment', async(req,res)=>{
            const payment = req.body;
            const result = await participantCollection.insertOne(payment)
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Contest_Hub!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})