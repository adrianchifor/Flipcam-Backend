var fs = require('fs');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var app = express();

// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/flipcam');

var Session = require('./app/models/session.js')
var Participant = require('./app/models/participant.js')
var Segment = require('./app/models/segment.js')

var port = 5000;

// Create our router
var router = express.Router();

router.get('/session', function(req, res) {
	var lat = req.param('lat');
	var lng = req.param('lng');

	res.statusCode = 200;
	res.json({
		key: 'abc'
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
