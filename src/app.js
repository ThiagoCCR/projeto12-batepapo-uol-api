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

//POST /participants

//GET /participants

//POST /messages

//GET /messages

//POST /stayus



app.listen(5000, () => {
  console.log("Listening on Port 5000");
});
