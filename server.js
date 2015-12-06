var fs = require('fs');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var app = express();

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/flipcam');

var Session = require('./app/models/session.js')
var Participant = require('./app/models/participant.js')
var Segment = require('./app/models/segment.js')

var serverIp = "31.187.70.159";
var port = 5000;

var sessionCloseTasks = {};

// Create our router
var router = express.Router();

router.get('/session', function(req, res) {
	var lat = req.param('lat');
	var lng = req.param('lng');
	var startedRecording = req.param('startedRecording');

	var coords = [];
	coords[0] = lng;
	coords[1] = lat;

 	var maxDistance = 1;
	maxDistance /= 6371;

	Session.find({
		location: {
			$near: coords,
			$maxDistance: maxDistance
		}
	}).where("active").equals(true)
	.limit(1).exec(function(err, session) {
		if (err) {
			res.statusCode = 500;
			res.json({
				message: "Error"
			});
			return;
		}

		var newParticipant = new Participant();
		newParticipant.startedRecording = startedRecording;
		newParticipant.uploadUrl = "";
		newParticipant.uploaded = false;

		newParticipant.save(function(err) {
			if (err) {
				res.statusCode = 500;
				res.json({
					message: "Error"
				});
				return;
			}

			if (session.length == 0) {
				session = new Session();
				session.participantKeys = [];
				session.participantKeys.push(newParticipant._id);
				session.location = [lng, lat];
				session.segments = [];
				session.created = new Date().getTime();
				session.finalUrl = uuid.v4() + ".mp4";
				session.ready = false;
				session.active = true;

				session.save(function(err) {
					if (err) {
						res.statusCode = 500;
						res.json({
							message: "Error"
						});
						return;
					}

					res.statusCode = 200;
					res.json({
						key: newParticipant._id
					});
				});

				return;
			}

			session[0].participantKeys.push(newParticipant._id);
			session[0].save(function(err) {
				if (err) {
					res.statusCode = 500;
					res.json({
						message: "Error"
					});
					return;
				}

				res.statusCode = 200;
				res.json({
					key: newParticipant._id
				});
			});
		});
	});
});

router.get('/segment', function(req, res) {
	var participantKey = req.param('key');

	res.statusCode = 200;
	res.json({
		start: 1449335663643,
		end: 1449335665863
	});
});

router.get('/recording', function(req, res) {
	var participantKey = req.param('key');

	res.statusCode = 200;
	res.json({
		ready: true
	});
});

router.post('/upload', multer({ dest: '/data/www/uploads/'}).single('video'),
	function(req, res) {

	var participantKey = req.param('key');

	Participant.findById(participantKey, function(err, participant) {
		if (err) {
			res.statusCode = 500;
			res.json({
				message: "Error"
			});
			return;
		}

		if (!participant) {
			res.statusCode = 500;
			res.json({
				message: "Error"
			});
			return;
		}

		participant.uploadUrl = req.file.filename;
		participant.uploaded = true;
		participant.save(function(err) {
			if (err) {
				res.statusCode = 500;
				res.json({
					message: "Error"
				});
				return;
			}

			res.statusCode = 200;
			res.json({
				message: "Uploaded"
			});
		});
	});
});

// REGISTER ROUTES
app.use('/api/v1', router);

// START THE SERVER
http.createServer(app).listen(port);
console.log('Magic happens on localhost:' + port + "/api/v1/..");
