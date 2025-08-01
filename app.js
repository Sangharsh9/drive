const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const connectDB = require('./config/db');
connectDB();
  const userRoutes= require('./routes/user.routes');
  const indexRoutes = require('./routes/index.routes');
  app.use(express.json());
  app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/user',userRoutes);
app.use('/',indexRoutes);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
}) ;   