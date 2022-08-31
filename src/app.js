import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());


//POST /participants

//GET /participants

//POST /messages

//GET /messages

//POST /stayus













app.listen(5000, () => {
  console.log("Listening on Port 5000");
});
