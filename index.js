// Example express application adding the parse-server module to expose Parse
// compatible API routes.

const util = require('util');

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Parse out the body for POST requests
var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true})); // to support URL-encoded bodies

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('Make sure to star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

app.post('/users/new', function(req, res) {
  var verifier = require('google-id-token-verifier');

  console.log("Req: " + util.inspect(req));
  console.log("Query: " + JSON.stringify(req.query));
  console.log("ID Token: " + req.query.idToken);
  console.log("Body: " + req.body);

  var clientId = '273173107052-dr7dubsvn22o86k7lu9tlanlm8i6ursj.apps.googleusercontent.com';
  var idToken = 'blah';
  if (req.body) {
    console.log("Body ID Token: " + req.body.idToken);
    idToken = req.body.idToken;
  }

  verifier.verify(idToken, clientId, function (err, tokenInfo) {
    if (!err) {
      // use tokenInfo here
      console.log(tokenInfo);
    } else {
      console.log("There was an error: " + err);
    }
  });

  var response = {
    status  : 200,
    success : 'You did it!'
  }

  res.end(JSON.stringify(response));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);

