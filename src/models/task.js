// require mongoose
const mongoose = require('mongoose');

// creates a Task schema for every task on the db
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        // property which creates a user-task relationship
        type: mongoose.Schema.Types.ObjectId,   // stores the _id of the user who created the task
        required: true,
        ref: 'users'  // indicates that the _id will be found in User collection(only reqd if you ever want to populate the fields)
    }
}, {
    // options object on the schema
    timestamps: true
    // adds the createdAt and updatedAt(last updation time) fields in every Task document
})

// creates a Task model for mongoose data which will be stored on 'tasks' collection
const Task = mongoose.model('tasks', taskSchema);

// export the task model
module.exports = Task;