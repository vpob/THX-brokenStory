var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var app = express();

var JWT_SECRET = 'thinbokes'


var db = null;
MongoClient.connect(process.env.MONGOLAB_URI || 'mongodb://root:thxroot@ds015924.mlab.com:15924/thx' || 'mongodb://localhost:27017/THX', function(err, dbconn){
	if(!err){
		console.log("...We are connected to DB");
		db = dbconn;
	}
});


app.use(bodyParser.json());

app.use(express.static('public'));


app.get('/brokes', function(req, res, next){

	db.collection('brokes', function(err, brokesCollection){
		brokesCollection.find().toArray(function(err, brokes){
			return res.json(brokes);
		});
	});

});

app.post('/brokes', function(req, res, next){

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);

db.collection('brokes', function(err, brokesCollection){
		var newBroken = {
			text: req.body.newBroken,
			user: user._id,
			username: user.username
		};

		brokesCollection.insert(newBroken, {w:1}, function(err){
			return res.send();
		});
	});

});

app.put('/brokes/remove', function(req, res, next){

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);

db.collection('brokes', function(err, brokesCollection){
		var brokenId = req.body.broken._id;
		brokesCollection.remove({_id: ObjectId(brokenId), user: user._id}, {w:1}, function(err, resault){
			return res.send();
		});
	});

});

app.post('/users', function(req, res, next){

	db.collection('users', function(err, brokesCollection){

		bcrypt.genSalt(10, function(err, salt){
			bcrypt.hash(req.body.password, salt, function(err, hash){

			var newUser = {
			username: req.body.username,
			password: hash
			};

			brokesCollection.insert(newUser, {w:1}, function(err){
				return res.send();
			});
		  });
		});
	  });
});

app.put('/users/login', function(req, res, next){

	db.collection('users', function(err, usersCollection){

		usersCollection.findOne({username: req.body.username},function(err, user){
			bcrypt.compare(req.body.password, user.password, function(err, resault){
				if(resault){
					var token = jwt.encode(user, JWT_SECRET);
					return res.json({token: token});
				} else {
					return res.status(400).send();
				}
			});
		});

	});
});


app.listen(process.env.PORT, function(){
	console.log('Listening ....');
});