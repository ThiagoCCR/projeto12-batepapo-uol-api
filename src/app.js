import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("buzzquizz");
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;
  let listOfParticipants;

  //testar se o nome e valido
  if (!name) {
    return res.status(422).send("Nome de usuário inválido!");
  }

  //testar se já existe usuário com o mesmo nome
  try {
    listOfParticipants = await db.collection("participants").find().toArray();
  } catch (error) {
    return res.sendStatus(500);
  }

  if (listOfParticipants.includes(name)) {
    return res.status(409).send("Usuário já cadastrado!");
  }

  //adc na db o usuário
  try {
    const addedParticipant = await db
      .collection("participants")
      .insertOne({ name: name, lastStatus: Date.now() });
    res.sendStatus(201);
  } catch (error) {
    return res.sendStatus(500);
  }

  //adc status de entrada
  
});

app.get("/participants", async (req, res) => {
  try {
    const listOfParticipants = await db
      .collection("participants")
      .find()
      .toArray();
    res.status(200).send(listOfParticipants);
  } catch (error) {
    return res.sendStatus(500);
  }
});

//POST /messages

//GET /messages

//POST /stayus

app.listen(5000, () => {
  console.log("Listening on Port 5000");
});
