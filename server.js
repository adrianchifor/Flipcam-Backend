var fs = require('fs');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var videoconcat = require('./app/videoconcatjs/videoconcat.js')
var app = express();

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/flipcam');

var Session = require('./app/models/session.js')
var Participant = require('./app/models/participant.js')
var Segment = require('./app/models/segment.js')

var serverIp = "[SERVER IP]";
var port = 5000;

var sessionCloseTasks = {};

var videoReady = function(name) {
	console.log(name);

    Session.find({
		finalUrl: name
	}).limit(1).exec(function(err, session) {
		if (err) {
			console.log(name+" failed to set ready");
			return;
		}

		if (session.length == 0) {
			console.log(name+" not found. Failed to set ready");
			return;
		}

		session[0].ready = true;
		session[0].save(function(err) {
			if (err) {
				return;
			}

			console.log(name+" is ready");
		})
	});
}

videoconcat.connect(videoReady);

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
	var readyTimestamp = req.param('readyTimestamp');

	var segmentLength = 5000;
	var sessionTimeout = 15000;

	if (sessionCloseTasks[participantKey]) {
		clearTimeout(sessionCloseTasks[participantKey]);
		delete sessionCloseTasks[participantKey];
	}

	Session.find({
		participantKeys: participantKey
	}).where("active").equals(true)
	.limit(1).exec(function(err, session) {
		if (err) {
			res.statusCode = 500;
			res.json({
				message: "Error"
			});
			return;
		}

		if (session.length == 0) {
			res.statusCode = 404;
			res.json({
				message: "Session not found"
			});
			return;
		}

		var newSegment = new Segment();
		newSegment.participantKey = participantKey;

		if (session[0].segments.length == 0) {
			newSegment.startTimestamp = readyTimestamp;
			newSegment.stopTimestamp = parseInt(readyTimestamp) + segmentLength;
			newSegment.save(function(err) {
				if (err) {
					res.statusCode = 500;
					res.json({
						message: "Error"
					});
					return;
				}

				session[0].segments.push(newSegment._id);
				session[0].save(function(err) {
					if (err) {
						res.statusCode = 500;
						res.json({
							message: "Error"
						});
						return;
					}

					sessionCloseTasks[participantKey] = setTimeout(function() {
						closeSession(participantKey);
					}, sessionTimeout);

					res.statusCode = 200;
					res.json({
						startTimestamp: newSegment.startTimestamp,
						stopTimestamp: newSegment.stopTimestamp
					});
				})
			});
		} else {
			Segment.findById(session[0].segments[session[0].segments.length-1],
				function(err, segment) {

				if (err) {
					res.statusCode = 500;
					res.json({
						message: "Error"
					});
					return;
				}

				if (!segment) {
					res.statusCode = 500;
					res.json({
						message: "Error"
					});
					return;
				}

				newSegment.startTimestamp = parseInt(segment.stopTimestamp) + 1;
				newSegment.stopTimestamp = parseInt(segment.stopTimestamp) + 1 + segmentLength;
				newSegment.save(function(err) {
					if (err) {
						res.statusCode = 500;
						res.json({
							message: "Error"
						});
						return;
					}

					session[0].segments.push(newSegment._id);
					session[0].save(function(err) {
						if (err) {
							res.statusCode = 500;
							res.json({
								message: "Error"
							});
							return;
						}

						sessionCloseTasks[participantKey] = setTimeout(function() {
							closeSession(participantKey);
						}, sessionTimeout);

						res.statusCode = 200;
						res.json({
							startTimestamp: newSegment.startTimestamp,
							stopTimestamp: newSegment.stopTimestamp
						});
					})
				});
			});
		}
	});
});

function closeSession(participantKey) {
	Session.find({
		participantKeys: participantKey
	}).where("active").equals(true)
	.limit(1).exec(function(err, session) {
		if (err) {
			console.log("Failed to close session");
			return;
		}

		if (session.length == 0) {
			return;
		}

		session[0].active = false;
		session[0].save(function(err) {
			if (err) {
				console.log("Failed to close session");
				return;
			}

			console.log("Session " + session[0]._id + " has been closed");

			if (sessionCloseTasks[participantKey]) {
				delete sessionCloseTasks[participantKey];
			}
		})
	});
}

function videoConcatenate(session) {
	var data = {cuts: [], output: session.finalUrl};

	Segment.find({
		'_id': { $in: session.segments }
	}).exec(function(err, segments) {
		if (err) {
			return;
		}

		if (segments.length == 0) {
			return;
		}

		var participantKeysArray = [];

		for (var i = 0; i < segments.length; i++) {
			participantKeysArray.push(segments[i].participantKey);
		}

		Participant.find({
			'_id': { $in: participantKeysArray }
		}).exec(function(err, participants) {
			if (err) {
				return;
			}

			if (participants.length == 0) {
				return;
			}

			for (var i = 0; i < segments.length; i++) {
				var participantTemp;
				for (var j = 0; j < participants.length; j++) {
					if (participants[j]._id == segments[i].participantKey) {
						participantTemp = participants[j];
						break;
					}
				}

				var startMs = parseInt(segments[i].startTimestamp) -
					parseInt(participantTemp.startedRecording);

				var stopMs = parseInt(segments[i].stopTimestamp) -
					parseInt(participantTemp.startedRecording);

				var cutpoint = {
					start: parseInt(startMs)/1000,
					stop: parseInt(stopMs)/1000,
					video: participantTemp.uploadUrl
				};

				data.cuts.push(cutpoint);
			}

			videoconcat.concat(data);
		});
	});
}

router.get('/recordings', function(req, res) {
	var readySessions = [];

	Session.find().where("ready").equals(true).limit(1000).sort({created: -1})
		.exec(function(err, sessions) {

		if (err) {
			res.statusCode = 500;
			res.json({
				message: "Error"
			});
			return;
		}

		if (sessions.length == 0) {
			res.statusCode = 404;
			res.json({
				message: "No recordings found"
			});
			return;
		}

		for (var i = 0; i < sessions.length; i++) {
			readySessions.push({
				videoUrl: "http://" + serverIp + "/uploads/" + sessions[i].finalUrl,
				created: sessions[i].created
			});
		}

		res.statusCode = 200;
		res.json(readySessions);
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

			Session.find({
				participantKeys: participantKey
			}).limit(1).exec(function(err, session) {
				if (err) {
					res.statusCode = 200;
					res.json({
						message: "Uploaded"
					});
				}

				if (session.length == 0) {
					res.statusCode = 200;
					res.json({
						message: "Uploaded"
					});
				}

				var allFinished = false;

				Participant.find({
					'_id': { $in: session[0].participantKeys }
				}).exec(function(err, participants) {
					if (err) {
						res.statusCode = 200;
						res.json({
							message: "Uploaded"
						});
					}

					if (participants.length == 0) {
						res.statusCode = 200;
						res.json({
							message: "Uploaded"
						});
					}

					for (var i = 0; i < participants.length; i++) {
						allFinished = participants[i].uploaded;

						if (!allFinished) {
							break;
						}
					}

					if (allFinished) {
						videoConcatenate(session[0]);
					}

					res.statusCode = 200;
					res.json({
						message: "Uploaded"
					});
				});
			});
		});
	});
});

// REGISTER ROUTES
app.use('/api/v1', router);

// START THE SERVER
http.createServer(app).listen(port);
console.log('Magic happens on localhost:' + port + "/api/v1/..");
