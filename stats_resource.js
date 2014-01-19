var cache = require('memory-cache');
var Stat = require('./Stat');
var stats = require('./lib/stats');



module.exports = function(app){
  app.get('/stats/:mountain',handleStats);
};

function hash(mountain){
  return 'mt-' + mountain;
}

function handleStats(req,res){
  if(Stat.Mountains.indexOf(req.params.mountain) == -1){
    res.statusCode = 404;
    return res.send();
  }

  var k = hash(req.params.mountain);
  var v = cache.get(k);
  if(v !== null)
    return respond(v);

  function respond(obj){
    res.set('Cache-Control', 'public, s-maxage=5');
    res.set('Expires', '5');
    res.send(obj);
  }

  stats.currentBusyIndex(req.params.mountain,function(err,obj){
    if(err){
      res.statusCode = 500;
      return res.send();
    }

    cache.put(k,obj,5*60*1000);
    respond(obj);
  });
}