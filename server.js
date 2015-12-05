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

var videoconcat = require('./app/videoconcatjs/videoconcat.js')

var port = 5000;

// Create our router
var router = express.Router();

var videoReady = function(name) {
    //TODO: save change of state to database
    //for now just print to console
    console.log(name+" is ready");
}


videoconcat.connect(videoReady);

//TODO: call videoconcat.concat(data) when a task is required
//TODO: REMOVE this
router.get('/test', function(req, res) {
    var data = {
        "cuts": [{
            "start": "00:00:00.0",
            "stop": "00:00:02.0",
            "video": "IMG_1985.MOV"
        }, {
            "start": "00:00:02.0",
            "stop": "00:00:04.0",
            "video": "IMG_0314.MOV"
        }
        ],
        "output": "joined.MOV"
    };

    videoconcat.concat(data);
	res.statusCode = 200;
	res.json({
		key: 'abc'
	});
});
//end TODO

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

router.post('/upload', multer({ dest: './uploads/'}).single('video'), function(req, res) {
	var participantKey = req.param('key');

	res.statusCode = 200;
	res.json({
		message: "uploaded"
	});
});

// REGISTER ROUTES
app.use('/api/v1', router);

// START THE SERVER
http.createServer(app).listen(port);
console.log('Magic happens on localhost:' + port + "/api/v1/..");
