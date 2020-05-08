// require mongoose
const mongoose = require('mongoose');
// require validator
const validator = require('validator');
// bcrypt for password hashing
const bcrypt = require('bcryptjs');
// for json web token handling
const jwt = require('jsonwebtoken');


// requires the task model for removing all tasks of a user when we remove the user
const Task = require('./task');

// creates a User schema for mongoose data which will be stored on 'users' collection
// schema is specifically important as middlewares only run on schemas and not direct models
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email address'],
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            // value stores the input user value. if no error is thrown, provided data is considered valid
            if(!validator.isEmail(value)) {
                throw new Error('Invalid email format');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot be a part of your password');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Only positive values for age');
            }
        }
    },
    // an array to store all JWT's for a user for multi-device access
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    // to store the user profile images as binary
    avatar: {
        type: Buffer // for binary data
    }
}, {
    // options object on the schema
    timestamps: true
    // adds the createdAt and updatedAt(last updation time) fields in every User document
});

// creates a virtual property on userSchema i.e. a property associated with a document
// but not saved with it in the db
userSchema.virtual('tasks', {
    ref: 'tasks',
    localField: '_id',
    foreignField: 'owner'
});

// creates an instance method for stopping sensitive info to go to user

/* This .toJSON method always runs when express starts converting a user instance (object) to JSON
   for sending it to the user. (res.send(user))
   This fn. deletes the sensitive data from that object so that it never reaches the client */
userSchema.methods.toJSON = function() {
    const user = this;

    // converts the instance to an object
    const userObject = user.toObject();

    // deletes the 3 properties on the object
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    // returns the newly defined object
    return userObject;

}

// creates an instance method for use on an User instance
userSchema.methods.getAuthToken = async function() {
    // creates a standard function to use 'this' binding which stores the user instance 
    // the fn is called on

    const user = this;

    // creates a new token
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    // appends the new token at end of tokens array for that user
    user.tokens = user.tokens.concat({ token: token.toString() });

    // saves the user
    await user.save();
    // returns the generated token
    return token;    
}

// creates a model method for use on the User Model
userSchema.statics.findByCredentials = async (email, password) => {
    // first tries to find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
        // if email doesn't match stops trying to login
        throw new Error('Unable to login');
    }
    // if email matches, tries to match password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        // if password doesn't match stops trying to login
        throw new Error('Unable to login');
    }

    // else returns the user
    return user;
}

// applies and uses middleware for password hashing on the schema
// applies middleware just before the saving of a document on db
userSchema.pre('save', async function(next) {
    //'this' refers to the document being stored. Use new variable to store it for easy use
    const user = this;

    // returns true if the specified value is created or has a new value 
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    // tells mongoose to proceed to further tasks and this middleware fn is over
    next();
})

// applies and uses a middleware for removing all tasks of a user when we delete a user
// applies middleware just before a user gets removed from db
userSchema.pre('remove', async function(next) {
    const user = this;
    // deletes all the tasks whose owner is the user to be deleted
    await Task.deleteMany({ owner: user._id });
    next();
})

// uses the schema to create a model, should be after all schema calls and middleware customisations
const User = mongoose.model('users', userSchema);

// exports the User model
module.exports = User;
