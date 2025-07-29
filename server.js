require('dotenv').config();
require('./database/db');
const studentRoute = require("./routes/Student");
const authRoute = require('./routes/Auth');
const emailRoute = require('./routes/email');
const subjectRoute = require('./routes/Subject');
const express = require('express'); 
const cors = require('cors');
// const fs = require('fs');
// const Subject = require('./database/models/Subject')
// const data = JSON.parse(fs.readFileSync('../subjects.json'));
//  Subject.insertMany(data).then(()=> console.log("data inserted"))


const PORT = process.env.PORT;
const app= express();
app.use(cors());
app.use(express.json());

app.use("/api",studentRoute);
app.use("/api",authRoute);
app.use("/api",emailRoute);
app.use("/api",subjectRoute);



app.listen(PORT,'0.0.0.0',()=>console.log(`app is listing on port ${PORT}`));
