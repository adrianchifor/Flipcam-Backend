var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Session = new Schema({
    participantKeys: [String],
    location: {
        type: [Number],
        index: '2d'
    },
    segments: [String],
    created: Number,
    finalUrl: String,
    ready: Boolean,
    active: Boolean
});

module.exports = mongoose.model('Session', Session);
