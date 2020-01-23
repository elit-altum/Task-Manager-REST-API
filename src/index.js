// requires express
const express = require('express');

// requires mongoose.js to just connect to database
require('./db/mongoose');
// imports the user router
const userRouter = require('./routers/userRouter');
// imports the task router
const taskRouter = require('./routers/taskRouter');

// creates an express app
const app = express();

// applies a middleware on the server which parses all the incoming HTTP requests from json
app.use(express.json());

// attaches the router/mini-app to the main app
app.use(userRouter);
app.use(taskRouter);

// tries to use Heroku port, else defaults to 3000
const port = process.env.PORT;

// sets up app at port
app.listen(port, () => {
    console.log('Server is up on port :', port);
});
