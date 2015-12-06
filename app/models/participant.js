var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Participant = new Schema({
    startedRecording: Number,
    uploadUrl: String,
    uploaded: Boolean
});

module.exports = mongoose.model('Participant', Participant);
