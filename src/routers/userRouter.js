// Creates a router/mini-app for user endpoints

// requires express
const express = require('express');

// requires multer for file uploads
const multer = require('multer');

// requires sharp for avatar/profile-image editing
const sharp = require('sharp');

// imports the email functions to send emails
const { sendWelcomeEmail, sendCancelEmail } = require('../mails/account');

// imports the express middleware for authenticating users with their JWT
const authUser = require('../middleware/authUser');

// imports the User model for database storage of users
const User = require('../models/user');

// creates a new router/mini-app
const router = express.Router();

// Setting up server paths and endpoints

/* We can pass async functions in express as they only change the return value of functions and 
  not their behaviour, and express has nothing to do with the return values. */

// <--------------- User Endpoints --------------->

// 1. User creation end-point
router.post('/users', async (req, res) => {

    // creates a new User instance from the data given by HTTP request
    const user = new User(req.body);

    // as errors are only shown as promise rejects and we don't have access to them
    // therefore, we use try - catch
    try {
        // saves new user to database
        const newUser = await user.save();
        const token = await newUser.getAuthToken();

        // send welcome email
        sendWelcomeEmail(newUser.email, newUser.name);

        // if successfully created, returns the document created
        res.status(201).send({
            user: newUser,
            token
        });

    } catch(e) {
        // if failure, indicates a bad request which failed validation
        res.status(400).send(e);
    }
});

// 2. User profile picture upload and update end point. Allows a user to upload a file as his profile pic
const upload = multer({
    // creates a new multer instance such that all files served are stored in a avatar folder in root 
    // of directory
    limits: {
        fileSize: 1000000 // limits filesize to 1MB
    },
    fileFilter (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only images upload'));
        }

        cb(undefined, true); // doesn't send an error and saves the file in 'dest'
    }
});

// uses the middleware to upload a single file named avatar in the form-data of the incoming request
router.post('/users/me/avatar', authUser, upload.single('avatar'), async (req, res) => {

    if(!req.file) {
        return res.status(400).send({ error: 'Only upload images' });    
    }

    // uploads the avatar to the associated user document by standardising it using sharp 
    // convert to png and resize the image
    const avatarBuffer = await sharp(req.file.buffer).resize({ width: 250, height: 250}).png().toBuffer();

    req.user.avatar = avatarBuffer;
    await req.user.save();
    res.send({ success: 'Uploaded successfully.' })

}, (err, req, res, next) => {
    // function handling express errors
    res.status(400).send({ error: err.message })
});

// 3. User profile picture delete endpoint
router.delete('/users/me/avatar', authUser, async (req, res) => {

    if(!req.user.avatar) {
        return res.status(404).send({ error: 'No avatar found' });
    } 
    // removes the image
    req.user.avatar = undefined;
    // saves the user
    req.user.save();
    res.send({ success: 'Deleted successfully.' })
});

// 4. Display profile picture endpoint
router.get('/users/:id/avatar', async (req, res) => {
    
    // a general URL for user images
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }

        // else display the user's image
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);

    } catch(e) {
        // user not found
        res.status(404).send();
    }
});

// 2. User login endpoint. Logs in a user by verifying email and password
router.post('/users/login', async (req, res) => {
    try {
        // uses a statically defined user method
        const user = await User.findByCredentials(req.body.email, req.body.password);

        if (!user) {
            // if no matching user found
            return res.status(404).send(e);
        }

        const token = await user.getAuthToken();
        res.send({
            user,
            token
        });

    } catch(e) {
        res.status(400).send(e);
    }
});

// 3. User logout endpoint. Single token/session only
router.post('/users/logout', authUser, async (req, res) => {
    
    try {
        // filters the array and only stores tokens which do not match the provided one
        req.user.tokens = req.user.tokens.filter( token => token.token !== req.token);
        await req.user.save();

        res.send({
            success: 'Logged out successfully!'
        });

    } catch(e) {
        res.status(500);
    }
});

// 4. User logout endpoint. All tokens/sessions removal
router.post('/users/logoutAll', authUser, async (req, res) => {
    try {
        // sets the tokens array to an empty array
        req.user.tokens = [];

        // saves the updated instance
        await req.user.save();

        res.send({
            success: 'Logged out successfully'
        });
    } catch(e) {
        res.status(500);
    }

});

// 3. Users profile endpoint. Gets a user's profile by authenticating his JWT first
// attaches the authenticate user middleware
router.get('/users/me', authUser, async (req, res) => {
    res.send(req.user);
});

// 5. User update endpoint. Updates a user found by it's id
router.patch('/users/me', authUser, async (req, res) => {
    // Object.keys returns all the object properties/keys as strings in an array
    const updates = Object.keys(req.body);

    // an array of all the updates we can allow on the data
    const allowedUpdates = ['name', 'age', 'email', 'password'];

    let isValid;

    if (updates.length) {
       isValid = updates.every( update => allowedUpdates.includes(update) );
    } else {

        // on an empty array every condition is satisfied, i.e every() returns true for everything
        isValid = false;
    }

    if (!isValid) {
        return res.status(400).send({ error : 'Invalid updates being applied' });
    }

    // for the actual user updation, if valid operation is performed
    try {
        // applying the updates manually
        /* it applies dynamic updating i.e. if update = name 
                    user.name = req.body.name
            this is used for dynamic property setting
        */
        updates.forEach( update => req.user[update] = req.body[update] );

        // then saves the updated user. The new values go through the validators and middlewares
        // simple updateById() bypasses the midddlewares and validators and directly manipulates the db
        await req.user.save();

        // else send the user data
        res.send(req.user);

    } catch(e) {
        // runs for a validation error
        res.status(400).send(e);
    }
});

// 6. User delete endpoint. Deletes a user by first verifying it's JWT
router.delete('/users/me', authUser, async (req, res) => {

    try {
        // deletes the user returned from the authUser fn
        await req.user.remove()

        // sends the cancellation email
        sendCancelEmail(req.user.email, req.user.name);

        // sends the deleted info back
        res.send(req.user);

    } catch(e) {
        res.status(400).send(e);
    }
});



module.exports = router;