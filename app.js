var mongoose  = require('mongoose');

var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost/epic';

mongoose.connect(mongoUrl);
mongoose.connection.on('error',function(err){
  console.error(err);
  process.exit(101);
});

var Stat = require('./Stat');

/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , hbs = require('./lib/hbshelpers')
  , path = require('path');

// Express 3.0 App
var app = express();

var oneYear = 31557600000;

app.configure(function(){
  app.set('port', process.env.PORT || 8080);
  app.set('views',path.join(process.cwd(), 'views'));
  app.set('view engine', 'hbs');

  app.use(express.compress());
  app.use(express.static(path.join(process.cwd(), 'public'), { maxAge: oneYear }));
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(app.router);

  app.use(function(req, res, next){
    res.statusCode = 404;
    res.render('error/404');
  });

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function navBar(sel){
  var navs = [];
  Stat.Mountains.forEach(function(m){
    
    var obj = {
      name : m,
      val : m,
      selected : false
    };

    if(sel === m)
      obj.selected = true;

    navs.push(obj);
  });

  return navs;
}

app.get('/',function(req,res){
  res.redirect('/MtBrighton');
});

app.get('/:mountain',function(req,res){

  if(Stat.Mountains.indexOf(req.params.mountain) == -1){
    res.statusCode = 404;
    return res.render('error/404');
  }
  var doy = Number(req.query.doy) || new Date().getDOY();
  var d = new Date(doy*24*60*60*1000);
  res.render('show',{date : d,prevDoy : doy-1,nextDoy :(doy+1),doy : doy,mountain : req.params.mountain, navBar : navBar(req.params.mountain) });
});

app.get('/:mountain/stats.json',function(req,res){

  var doy = req.query.doy || new Date().getDOY();

  Stat.find({mountain : req.params.mountain,DoY : doy})
  .sort({date : 1})
  .exec(function(err,docs){
    if(err)
      return res.send(500);

    function mapStat(k,s){
      if(s[k] < 0)
        return [s.date.getTime(),0];
      return [s.date.getTime(),s[k]];
    }

    var d = new Date(doy*24*60*60*1000);

    var obj = {
      date : d,
      liftStats : docs.map(mapStat.bind(this,'lifts')),
      liftDxStats : docs.map(mapStat.bind(this,'liftsDx'))
    };

    res.send(obj);
  })
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Server listening on port " + app.get('port'));
});
