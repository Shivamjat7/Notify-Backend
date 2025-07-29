require('dotenv').config();
const mongoose = require('mongoose');

const connectToMONGO=mongoose.connect(process.env.MONGO_URI,{
 useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>console.log("connect to mongo"))
.catch((err)=>console.log(err.message));

module.exports=connectToMONGO;
