import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import locale from "dayjs/locale/pt-br.js";
import joi from "joi";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

//mongodb
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("buzzquizz");
});

//joi
const messageSchema = joi.object({
  from: joi.string().required().trim(),
  to: joi.string().required().trim(),
  text: joi.string().required(),
  type: joi.string().required().valid("message", "private_message"),
  time: joi.string().required(),
});

app.post("/participants", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(422).send("Nome de usuário inválido!");
  }

  try {
    const listOfParticipants = await db
      .collection("participants")
      .find()
      .toArray();
    const now = dayjs().locale("pt-br").format("HH:mm:ss");
    const statusMessage = {
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: now,
    };

    if (
      listOfParticipants.filter(
        (val) => val.name.toLowerCase() === name.toLowerCase()
      ).length > 0
    ) {
      return res.status(409).send("Usuário já cadastrado!");
    }

    const addedParticipant = await db
      .collection("participants")
      .insertOne({ name: name, lastStatus: Date.now() });

    const addedStatus = await db
      .collection("messages")
      .insertOne(statusMessage);

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const listOfParticipants = await db
      .collection("participants")
      .find()
      .toArray();
    return res.status(200).send(listOfParticipants);
  } catch (error) {
    return res.sendStatus(500);
  }
});

app.get("/messages", async (req, res) => {
  const limit = parseInt(req.query.limit);
  const { user } = req.headers;

  if (limit) {
    try {
      const listOfMessages = await db.collection("messages").find().toArray();
      const filteredMessages = listOfMessages.reverse().filter((val, index) => {
        if (index < limit && (val.to === user || val.to === "Todos")) {
          return val;
        }
      });
      return res.status(200).send(filteredMessages.reverse());
    } catch (error) {
      return res.sendStatus(500);
    }
  } else {
    try {
      const listOfMessages = await db.collection("messages").find().toArray();
      const filteredMessages = listOfMessages.reverse().filter((val, index) => {
        if (val.to === user || val.to === "Todos" || val.from === user) {
          return val;
        }
      });
      return res.status(200).send(filteredMessages.reverse());
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }
  }
});

app.post("/messages", async (req, res) => {
  const User = req.headers.user;
  const { to, text, type } = req.body;
  const now = dayjs().locale("pt-br").format("HH:mm:ss");
  const templateMessage = {
    from: User,
    to: to,
    text: text,
    type: type,
    time: now,
  };
  const validation = messageSchema.validate(templateMessage, {
    abortEarly: false,
  });

  if (validation.error) {
    return res
      .status(422)
      .send(validation.error.details.map((res) => res.message));
  }

  try {
    const listOfParticipants = await db
      .collection("participants")
      .find()
      .toArray();

    if (
      listOfParticipants.filter(
        (val) => val.name.toLowerCase() === User.toLowerCase()
      ).length === 0
    ) {
      return res.status(409).send("Usuário inexistente!");
    }

    const addedMessage = await db
      .collection("messages")
      .insertOne(templateMessage);

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.post("/status", async (req, res) => {
  const username = req.headers.user;

  if (!username) {
    return res.sendStatus(422);
  }

  try {
    const listOfParticipants = await db
      .collection("participants")
      .find()
      .toArray();

    if (
      listOfParticipants.filter(
        (val) => val.name.toLowerCase() === username.toLowerCase()
      ).length === 0
    ) {
      return res.sendStatus(404);
    }

    const addedParticipant = await db
      .collection("participants")
      .insertOne({ name: username, lastStatus: Date.now() });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
  }
});

//deletar mensagem
app.delete("/messages/:ID_DA_MENSAGEM", async (req, res) => {
  const messageId = req.params.ID_DA_MENSAGEM;
  const User = req.headers.user;

  try {
    const message = await db
      .collection("messages")
      .findOne({ _id: new ObjectId(messageId) });

    if (!message) {
      return res.sendStatus(404);
    }

    if (message.from !== User) {
      return res.sendStatus(401);
    }
    console.log("oi");
    await db.collection("messages").deleteOne({ _id: ObjectId(messageId) });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro no servidor");
  }
});

//validar status dos usuários
setInterval(async () => {
  const listOfParticipants = await db
    .collection("participants")
    .find()
    .toArray();
  const listOfInactiveParticipants = listOfParticipants.filter(
    (participant) => Date.now() - Number(participant.lastStatus) > 10000
  );
  listOfInactiveParticipants.map(async (val) => {
    try {
      const now = dayjs().locale("pt-br").format("HH:mm:ss");
      const messageTemplate = {
        from: val.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: now,
      };
      await db.collection("participants").deleteOne(val);
      await db.collection("messages").insertOne(messageTemplate);
      console.log("atualizei!");
    } catch (error) {
      console.log(error);
    }
  });
}, 15000);

app.listen(5000, () => {
  console.log("Listening on Port 5000");
});
