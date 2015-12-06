var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Segment = new Schema({
    participantKey: String,
    startTimestamp: Number,
    stopTimestamp: Number
});

module.exports = mongoose.model('Segment', Segment);
