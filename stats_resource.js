var cache = require('memory-cache');
var async = require('async');
var Stat = require('./Stat');
var stats = require('./lib/stats');

module.exports = function(app){
  app.get('/stats/all',handleStats);
};


function getStat(mountain,callback){
  stats.currentBusyIndex(mountain,function(err,obj){
    if(err)
      return callback(err);

    obj.mountain = mountain;
    callback(null,obj);
  });
}


function handleStats(req,res){
  var k = 'all-stats';
  var v = cache.get(k);
  if(v !== null)
    return respond(v);

  function respond(obj){
    res.set('Cache-Control', 'public, s-maxage=5');
    res.set('Expires', '5');
    res.send(obj);
  }

  async.map(Stat.Mountains,getStat,function(err,results){
    if(err){
      res.statusCode = 500;
      return res.send({});
    }
    
    cache.put(k,results,5*60*1000);
    respond(results);
  });
}