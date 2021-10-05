const mongoose = require('mongoose');
const User = require('./user');

const taskSchema = mongoose.schema({
userEmail: {
        type: mongoose.schema.Types.email,
        ref: User
    },
    taskId: {
        type: String,
        require: true,
        index: { unique : true }
    },
    taskDesc: {
        type: String,
        require: true
    }

});

module.exports = mongoose.model('Tasks', taskSchema);