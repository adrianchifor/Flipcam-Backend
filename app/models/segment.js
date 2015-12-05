var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Segment = new Schema({
    id: Number,
    participantKey: Number,
    startTimestamp: Date,
    stopTimestamp: Date
});

module.exports = mongoose.model('Segment', Segment);
