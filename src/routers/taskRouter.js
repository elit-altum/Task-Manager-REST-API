// Creates a router/mini-app for task endpoints

// requires express
const express = require('express');

// imports the express middleware for authenticating users with their JWT
const authUser = require('../middleware/authUser');

// imports the Task model for database storage of tasks
const Task = require('../models/task');

// imports the User model
const User = require('../models/user');

// creates a new router/mini-app
const router = new express.Router();

// Setting up server paths and endpoints

/*We can pass async functions in express as they only change the return value of functions and 
  not their behaviour, and express has nothing to do with the return values. */

// <--------------- Task Endpoints --------------->

// 1. Task creation end-point
router.post('/tasks', authUser, async (req, res) => {

    const task = new Task({
        // spreads the body of the task provided by the client and attaches the owner property
        // to it
        ...req.body,
        owner: req.user._id
    });

    // tries to save task to database
    try {
        const newTask = await task.save();
        res.status(201).send(newTask);

    } catch (e) {
        res.status(400).send(e);
    }
});

// 2. Tasks read endpoint. Gets all the stored tasks
/* also uses query strings for filtering/pagination 
    a. GET /tasks?completed=(true/false)
    b. GET /tasks?limit=3&skip=6: skip and limit for pagination
    c. GET /tasks?sortBy=createdAt:desc : sorts all the tasks using createdAt in descending order
    1 = ascending
*/

router.get('/tasks', authUser, async (req, res) => {

    const match = {};
    const sort = {};

    if (req.query.completed) {
        // req.query returns string value only, so we use compare to get a boolean value
        match.completed = req.query.completed === 'true';
    }

    // checks if user wants to sort data and then sets the object for use in options while populating
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':'); // splits the order and property 

        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
        // if createdAt:asc
        // parts[0] = createdAt parts[1] = asc
        // sets as: sort.createdAt = 1;
    }

    try {
        // gets all tasks from the particular user using it's virtual property 
        /* The options object:
           - It controls the sorting/pagination features etc
             1. Pagination
                limit : no of documents to return per page
                skip: no of documents to skip to display documents in another page

                limit = 10 and skip = 30 displays the 4th page i.e skips the first 3 pages
                3 * 10 = 30 documents
                for first page limit = 10 and skip = 0 (skip = n * limit ; where n = page no. - 1)
            2. Sorting
                The property name (key) is the value to check while sorting
                The value specifies ascending/descending sort on that property
                 1 = ascending order
                -1 = descending order        
        */
        await req.user.populate({
            path: 'tasks',  // compare the documents in Tasks
            match,   // match them using the conditions provided in the object above eg. completed = true etc.
            options: {               
                limit: parseInt(req.query.limit), 
                skip: parseInt(req.query.skip),
                sort,
            }
        }).execPopulate();

        // if documents exist all are stored in an array
        if (!req.user.tasks) {
            return res.status(404).send();
        }

        res.send(req.user.tasks);
    } catch (e) {
        // only run if not able to connect to server. Therfore, 500 = internal server error
        res.status(500).send(e);
    }
});

// 3. Task read endpoint. Gets a saved task by id
router.get('/task/:id', authUser, async (req, res) => {

    const _id = req.params.id;  // stores all the route parameters (like id)

    try {
        // returns only the task which matches the id and is made by the same user who is requesting it
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) {
             // if a task is not found
            res.status(404).send();
        }

        // else send the found task
        res.send(task);
    } catch (e) {
        // only run if not able to connect to server. Therfore, 500 = internal server error
        res.status(500).send();
    }
});

// 4. Task update endpoint
router.patch('/task/:id', authUser, async (req, res) => {
    // for verifying the updates object
    const updates = Object.keys(req.body);

    const allowedUpdates = ['description', 'completed'];
    let isValid;

    if (updates.length) {
        isValid = updates.every( update => allowedUpdates.includes(update) );
    } else {
        isValid = false;
    }

    if(!isValid) {
        return res.status(400).send({ error: 'Invalid updates being applied' });
    }

    try {
        // finds the task by id
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id});

        if (!task) {
            return res.status(404).send();
        }

        // applying the updates manually
        /* it applies dynamic updating i.e. if update = name 
                    task.name = req.body.name
            this is used for dynamic property setting
        */
        updates.forEach( update => task[update] = req.body[update]);

        // then saves the updated task. The new values go through the validators and middlewares
        // simple updateById() bypasses the midddlewares and validators and directly manipulates the db
        await task.save();
    

        res.send(task);

    } catch(e) {
        res.status(400).send(e);
    }
});

// 5. Task delete endpoint. Deletes a task by it's id
router.delete('/task/:id', authUser, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch(e) {
        res.status(400).send();
    }
});

module.exports = router;