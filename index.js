const express = require('express')
const cors = require('cors')
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_TEST_KEY)
const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://contesthub-5c493.web.app/',
        'https://contesthub-5c493.firebaseapp.com'
    ],
    credentials: true
}))
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        // await client.connect();

        // create database
        const userCollection = client.db("ContestHub").collection("users")
        const contestCollection = client.db("ContestHub").collection("totalContest")
        const participantCollection = client.db("ContestHub").collection("participants")
        const taskCollection = client.db("ContestHub").collection("submittedTsk")
        const winnerCollection = client.db("ContestHub").collection("contestWinner")



        app.post("/winner", async (req, res) => {
            const user = req.body
            const result = await winnerCollection.insertOne(user)
            res.send(result)
        })

        app.get("/winner", async (req, res) => {
            const result = await winnerCollection.find().toArray()
            res.send(result)
        })
        app.get("/winner", async (req, res) => {
            let query = {}

            if (req.query?.contestName) {
                query = { contestName: req.query.contestName }
            }
            // const cursor = bookingCollection.find(query)
            // const result = await cursor.toArray()
            // res.send(result)
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/aggregateData', async (req, res) => {
            try {
                const result = await winnerCollection.aggregate([
                    {
                        $lookup: {
                            from: 'users', // Corrected collection name
                            localField: 'examinee',
                            foreignField: 'email',
                            as: 'userData'
                        }
                    },
                    {
                        $unwind: '$userData'
                    },
                    {
                        $project: {
                            examinee: 1,
                            contestName: 1,
                            status: 1,
                            userData: {
                                userImage: 1,

                            }
                        }
                    }
                ]).toArray();
                res.json(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }

        });


        app.get("user/count", async (req, res) => {
            const result = await userCollection.countDocuments()
            res.send({ result })
        })


        app.post("/users", async (req, res) => {
            const user = req.body
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.get("/users", async (req, res) => {
            let query = {}

            if (req.query?.email) {
                query = { email: req.query.email }
            }
            // const cursor = bookingCollection.find(query)
            // const result = await cursor.toArray()
            // res.send(result)
            const result = await userCollection.find(query).toArray()
            res.send(result)
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedUser = req.body;
            console.log(updatedUser)
            // console.log(updatedBooking);
            const updateDoc = {
                $set: {
                    name: updatedUser.name,
                    userImage: updatedUser.userImage
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        // get contest data
        // app.get("/contest", async (req, res) => {
        //     const result = await contestCollection.find().toArray()
        //     res.send(result)
        // })

        app.get("/contest", async (req, res) => {
            let query = {}

            if (req.query?.contestType) {
                query = { contestType: req.query.contestType }
            }
            // const cursor = bookingCollection.find(query)
            // const result = await cursor.toArray()
            // res.send(result)
            const result = await contestCollection.find(query).toArray()
            res.send(result)
        })
        // app.get("/contest", async (req, res) => {
        //     let query = {}

        //     if (req.query?.status) {
        //         query = { status: req.query.status }
        //     }
        //     // const cursor = bookingCollection.find(query)
        //     // const result = await cursor.toArray()
        //     // res.send(result)
        //     const result = await contestCollection.find(query).toArray()
        //     res.send(result)
        // })

        app.post("/contest", async (req, res) => {
            const contest = req.body
            const result = await contestCollection.insertOne(contest)
            res.send(result)
        })
        app.get("/contest/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) };
            const result = await contestCollection.findOne(filter);
            res.send(result);
        })

        app.patch('/contest/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedUser = req.body;
            if (updatedUser.status === 'confirmed') {
                // Update status to 'confirmed'
                const updatedDoc = { $set: { status: 'confirmed' } };
                const result = await contestCollection.updateOne(filter, updatedDoc);
                res.send(result);
            } 
            if (updatedUser.participant !== undefined ) {
                // Update status to 'confirmed'
                const updatedDoc = { $set: { participant: updatedUser.participant } };
                const result = await contestCollection.updateOne(filter, updatedDoc);
                res.send(result);
            }
            else {
                // Handle other updates (e.g., updating contest details)
                const updateDoc = {
                    $set: {
                        contestName: updatedUser.contestName,
                        contestType: updatedUser.contestType,
                        taskInstructions: updatedUser.taskInstructions,
                        endDate: updatedUser.endDate,
                        price: updatedUser.price,
                        prize: updatedUser.prize,
                        image: updatedUser.image
                    },


                };
                const result = await contestCollection.updateOne(filter, updateDoc);
                res.send(result);
                console.log(updatedUser)
                // console.log(updatedBooking);

            };

        })
        app.delete('/contest/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await contestCollection.deleteOne(query);
            res.send(result);
        })

        // get submittedTask
        app.get("/submittedTask", async (req, res) => {
            const result = await taskCollection.find().toArray()
            res.send(result)
        })

        // set status
        // app.patch('/contest/:id', async(req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id)}
        //     const updatedDoc = {
        //       $set:{
        //         status: 'confirmed'
        //       }
        //     }
        //     const result = await contestCollection.updateOne(filter, updatedDoc)
        //     res.send(result)
        //   })

        // payment_intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.

            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // send contest register user data
        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await participantCollection.insertOne(payment)
            res.send(result)
        })
        app.get("/payment", async (req, res) => {
            const result = await participantCollection.find().toArray()
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