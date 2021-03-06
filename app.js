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
  , cors = require('cors')
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

  app.use(cors());
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

require('./stats_resource')(app);

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

  res.render('show',{dateString : d,prevDoy : doy-1,nextDoy :(doy+1),doy : doy,mountain : req.params.mountain, navBar : navBar(req.params.mountain) });
});

app.get('/:mountain/stats.json',function(req,res){

  var doy = req.query.doy || new Date().getDOY();

  Stat.find({mountain : req.params.mountain,lDoY : doy, lHoD : { $gte : 5,$lte : 23 } } )
  .sort({date : 1})
  .exec(function(err,docs){
    if(err)
      return res.send(500);

    docs = filterOutliers(docs);

    function mapStat(k,s,div){
      var d = s.lDate;

      if(s[k] < 0)
        return [d.getTime(),0];
      return [d.getTime(),s[k]];
    }

    if(docs[0]){
      var d = docs[0].lDate;
    }else{
      var d = new Date();
    }

    getYesterday(req.params.mountain,doy,function(err,yesterday){
      if(err)
        return res.send(500);

      var obj = {
        mountain : req.params.mountain,
        dateString : d.toDateString(),
        liftStats : docs.map(mapStat.bind(this,'lifts')),
        liftPmStats : docs.map(mapStat.bind(this,'liftsPm')),
        yesterday : yesterday
      };

      res.send(obj);
    });
  });
});

function filterOutliers(data){
  data.forEach(function(d,idx){
    var pD = data[idx-1];
    if(!pD)
      return;

    if(pD.liftsDx < 0 && d.liftsDx > 0){
      data.splice(idx-1,2);
    }else if(d.liftsDx > 1500){
      data.splice(idx,1);
    }
  });
  return data;
}

function getYesterday(mountain,doy,callback){
  
  Stat.find({mountain : mountain,lDoY : doy-1, lHoD : { $gte : 5,$lte : 23 } } )
  .sort({date : 1})
  .exec(function(err,docs){
    if(err)
      return callback(err);

    docs = filterOutliers(docs);

    function mapStat(k,s,div){
      var d = s.lDate;
      d = new Date(d.getTime()+(24*60*60*1000));
      if(s[k] < 0)
        return [d.getTime(),0];
      return [d.getTime(),s[k]];
    }

    if(docs[0]){
      var d = docs[0].lDate;
    }else{
      var d = new Date();
    }

    var obj = {
      liftStats : docs.map(mapStat.bind(this,'lifts')),
      liftPmStats : docs.map(mapStat.bind(this,'liftsPm'))
    };

    return callback(null,obj);
  });
}

http.createServer(app).listen(app.get('port'), function(){
  console.log("Server listening on port " + app.get('port'));
});
