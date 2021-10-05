const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const paginate = require('express-paginate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8000;

const User = require('./user');
const Tasks = require('./tasks');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(paginate.middleware(10,50));

mongoose.connect('mongodb://localhost:27017/contacts');
mongoose.connection.on('connected', () => {
    console.log('connected to mongo DB on port 27017');
})
mongoose.connection.on('error', (error) => {
    console.log('error in connection to DB on port 27017: ', error);
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Handle GET call
app.get('/users/:emailId?/:apiKey?', async (req, res, next) => {
    let params = {
        emailId: req.query.emailId,
        apiKey: req.query.apiKey
    };

    if(params.apiKey) {
        encryptedPassword = await bcrypt.hash(params.apiKey, 10);
        const token = jwt.sign(
            { user_id: User._id, email },
            process.env.TOKEN_KEY,
            { expiresIn: "1h" }
          );
          // save user token
          User.token = token;
    }
    else res.send("Please provide an API Key");

    if(params.emailId){
        User.findOne({
            email: params.emailId
        },
        (error, email) => {
            if(error) res.send("User is not registered, Please register");
            if(email) {
                Tasks.find({
                    userEmail: email
                },
                (err, tasks) => {
                    if(err) res.json('Error in fetching tasks for the User');
                    else res.json(tasks);
                });
            }
        });
    }
    else {
        try{
            const [results, itemCount] = await Promise.all([
                User.find({}).limit(req.query.limit).skip(req.skip).lean().exec(),
                User.count({})
            ]);

            const pageCount = Math.ceil(itemCount/req.query.limit);
            res.json({
                object: 'list',
                has_more: paginate.hasNextPages(req)(pageCount),
                data: results
            });
        }
        catch (error){
            next(error);
        }
    }
});

// Handle POST Call
app.post('/users', (req, res) => {
    let newUser = new User({
        email: req.body.emailId,
        password: req.body.password,
    });

    if(!User.token) return res.send("JWT token not found");

    const oldUser = await User.findOne({ email: newUser.email });
    if(oldUser){
        res.status(400).send("User already exists");
    }
    newUser.save((error, user) => {
        if(error) {
            res.json({
                msg: "Failed to add a new contact" 
            });
        }
        res.json(user);
    });
});

app.post('/tasks', (req, res) => {
    let newTask = new Tasks({
        userEmail: req.body.emailId,
        taskId: req.body.taskId,
        taskDesc: req.body.taskDesc
    });

    User.findOne({email: newTask.userEmail}, (err, user) => {
        if(err) res.send("User does not exist, please register");
        if(user) {
            newTask.save((error, user) => {
                if(error) {
                    res.json({
                        msg: "Failed to add a new contact" 
                    });
                }
                res.json(user);
            });
        }
    });
    
});

// Handle DELETE call
app.delete('/users/:emailId', (req, res) => {
    User.deleteOne({ email: req.params.emailId }, (error, deletedUser) => {
        if(error) {
            res.json({
                msg: "Error in deleting contact"
            });
        }
        res.json(deletedUser);
    })
});