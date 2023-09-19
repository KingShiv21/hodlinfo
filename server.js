import express from "express";
import path from "path";
import mongoose from "mongoose";
import axios from "axios";
import { config } from "dotenv"
import cors from "cors"

config({
  path:"./data/config.env",
})

// connecting database
mongoose
  .connect( process.env.SERVER , {
    dbName: "results",
  })
  .then(() => console.log("Database Connected"))
  .catch((e) => console.log(e));

const resultSchema = new mongoose.Schema({
  name: String,
  last: String,
  buy: String,
  sell: String,
  volume:String,
  base_unit: String
});
const Result = mongoose.model("Results", resultSchema);


// creating server
const app = express();



// Using Middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
// Setting up View Engine
app.set("view engine", "ejs");
app.use(cors(
  {
      origin: [process.env.FROENT_URL],
      methods: ["GET" , "POST" , "PUT" , "DELETE"],
      credentials:true,
  }
))



// api / route 
app.route("/").get(async (req, res) => {
  
  // fetching data from the given api
  let data
  await axios.get("https://api.wazirx.com/api/v2/tickers/")
    .then((res) => {
    data = res.data
    }).catch(
      err => console.log(err)
    )

  // converting data into array format
  let topTenResult = Object.values(data)
  

  // saving top 10 results in database
  for (let index = 0; index < 10; index++) {
    let t = topTenResult[index]
    await Result.create({
      name: t.name,
      last: t.last,
      buy: t.buy,
      sell: t.sell,
      volume:t.volume,
      base_unit: t.base_unit
    })
  }
  
  //making featurs used for ejs file / home page
  const keys = Object.keys(data);

  let index ;

  let average = 0;
  for (index = 0; index < 10 ; index++) {
    average += Number(topTenResult[index].last)
  }
  average/=10;
  average = Math.trunc(average)



  let difference = []
  for ( index = 0; index < 10; index++) {
    difference[index] = Number(topTenResult[index].last) -average  
    difference[index] = Math.trunc(difference[index])
  }


  let percentage = []
  for ( index = 0; index < 10; index++) {
    if (difference[index] > 0) {
      percentage[index] = (difference[index] * 100)/Number(topTenResult[index].last)
    }
    else{
      percentage[index] = (difference[index] * 100)/average
    }
    percentage[index] = Math.trunc(percentage[index])
  }

  // rendering home page   
  res.status(200).render("home" , {results : topTenResult ,keys ,average , difference ,percentage});
});



app.listen(5000, () => {
  console.log("Server is working fine");
});
