// web server application
//      The local server is regarded as a connection between a local sqlite database and the web app

// absolute path
__dirPath = '/Users/ep/Desktop/DSD';

// create app instance
const express = require('express');
let app = express();
var sPoint, tWindow, tableID;

// add the static file path for linking other files to the local server
app.use(express.static(__dirPath));

// middleware to read body of raw request
app.use(function(req, res, next) {
    var data='';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { 
       data += chunk;
    });

    req.on('end', function() {
        req.body = data;
        next();
    });
});

// redirect to the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirPath + '/index.html');
});

// route of POST
app.post('/index', function(req, res) {
    // req.body is the detailed query passed to database
    var query = JSON.parse(req.body);
    sPoint = query.startPoint;
    tWindow = query.timeWindow;
    tableID = query.table;
    console.log('successfully get post');
    res.send('get post');
});

// route of GET
app.get('/index', function(req, res) {
    if (req.timeout) console.log('get timeout!')
    var query = 'select * from ' + tableID + ' where timestamp >= ' + sPoint * tWindow + ' and timestamp < ' + (++sPoint) * tWindow;
    console.log('Query [' + sPoint + ']');
    database.all(query, [], function(err, rows) {
        if (err) {
            console.log(err.message);
        }
        res.send(rows);
    });
});

// listen to port 8080 and start the server
app.listen(8080, function(){
    console.log('Listening to port 8080!');
});

// create database instance
const sqlite = require('sqlite3');
let database = new sqlite.Database(__dirPath + '/Data/test.db', function(err) {
    if (err) {
        console.log(err.message);
    }
    console.log('Connected to the database!');
});
database.run('PRAGMA cache_size = 32000;');