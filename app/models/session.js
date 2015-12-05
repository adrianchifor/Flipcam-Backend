var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Session = new Schema({
    id: Number,
    participantKeys: [Number],
    coordinates: [Number],
    segments: [Number],
    finalUrl: String,
    ready: Boolean,
    active: Boolean
});

module.exports = mongoose.model('Session', Session);
