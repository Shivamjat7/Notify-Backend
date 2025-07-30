require('dotenv').config();
const connectToMongo = require('./database/db');
const studentRoute = require("./routes/Student");
const authRoute = require('./routes/Auth');
const emailRoute = require('./routes/email');
const subjectRoute = require('./routes/Subject');
const suggestionRoute = require('./routes/Suggestion');
const express = require('express'); 
const cors = require('cors');



const PORT = process.env.PORT;
const app= express();

app.use(cors({
  origin: 'https://notify-cyan.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

app.use("/api",studentRoute);
app.use("/api",authRoute);
app.use("/api",emailRoute);
app.use("/api",subjectRoute);
app.use("/api",suggestionRoute);


connectToMongo().then(() => {
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
});
