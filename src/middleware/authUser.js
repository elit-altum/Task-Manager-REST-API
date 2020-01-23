// an express middleware function to validate a user token before providing access to a route

const jwt = require('jsonwebtoken');

// requires the user mongoose model
const User = require('../models/user');

const authUser = async (req, res, next) => {
    try {
        // gets the JWT provided in the header by removing the text 'Bearer
        const token = req.header('Authorization').replace('Bearer ', '');

        // checks if the JWT is valid/not expires
        // if valid, the payload object is returned
        const data = jwt.verify(token, process.env.JWT_SECRET);

        // finds the user by it's _id and checks if he is using a registered token which is present in
        // his tokens array
        const user = await User.findOne({ _id: data._id, 'tokens.token': token });
        // 'tokens.token' as a string, try to find a token in the array of tokens having same value 
        // as that provided

        if (!user){
            // if no user is found
            throw new Error(); // automatically runs the catch block
        }

        // provide the found user and it's token to the route by attaching it to the request
        req.token = token;
        req.user = user;
        // else allow the user to use the route
        next();

    } catch (e) {
        // if any error, do not allow user to use route and send back error
        res.status(403).send({ error: 'Please authenticate.' })
    }
    
}

module.exports = authUser;