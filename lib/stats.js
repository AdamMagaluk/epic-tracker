var Stat = require('../Stat');


var defaultMax = 1000;
var maxes = {
  'MtBrighton' : 200
};

function maxVal(m){
  return maxes[m] || defaultMax;
}

module.exports.historicalMax = historicalMax;
function historicalMax(mountain,key,callback){
  var sort = {};
  sort[key+'Pm'] = -1;
  Stat.findOne({mountain : mountain,DoY : {$gte : 9},liftsPm : {$lt : maxVal(mountain)} })
    .sort(sort)
    .exec(function(err,r){
      callback(err,r);
    });  
}

module.exports.currentVal = currentVal;
function currentVal(mountain,key,callback){
  var k = key + 'Pm';
  Stat.find({mountain : mountain,liftsPm : {$lt : maxVal(mountain)} })
    .limit(4)
    .sort({date : -1})
    .exec(function(err,results){
      if(err)
        return callback(err);

      var date = null;
      var total = 0;
      results.forEach(function(r){
        if(date === null)
          date = r.lDate;
        total+=r[k];
      });

      var nowMean = Math.round(total/results.length);
      callback(null,{date : date,mean : nowMean});
    });  
}

module.exports.currentBusyIndex = currentBusyIndex;
function currentBusyIndex(mountain,callback){
  historicalMax(mountain,'lifts',function(err,r){
    if(err)
        return callback(err);
    currentVal(mountain,'lifts',function(err,obj){
      if(err)
        return callback(err);
      
      obj.busyIndex = obj.mean/(r.liftsPm*0.90);
      obj.max = {lDate :r.lDate, value : r.liftsPm};
      callback(null,obj);
    });
  });  
}