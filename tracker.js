var request = require('request')
  , cheerio = require('cheerio')
  , mongoose = require('mongoose')
  , async = require('async')
  , Schema = mongoose.Schema;

var Stat = require('./Stat');

var EPIC_URL = 'https://www.epicmix.com/Activity/';

run();
setInterval(run,5*60*1000);

function run(){
  console.log(new Date(),'Starting Run')
  async.each(Stat.Mountains,getStats,function done(err,obj){
    if(err)
      console.error(err);
    else 
      console.log(new Date(),'Ran success');
  });
}

function getStats(mountain,callback){
  request(EPIC_URL+mountain+'.aspx', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      $ = cheerio.load(body);

      var d = new Date();
      var obj = {
        mountain : mountain,
        date : d
      };

      Stat.StatNames.forEach(function(k){
        obj[k] = Number($('#'+k+' .stats-count').text().replace(/[A-Za-z$-,]/g, ""));
      });

      var s = new Stat(obj);
      s.save(function(err){
        callback(err,obj);
      });

    }else{
      callback(error);
    }
  })
}

