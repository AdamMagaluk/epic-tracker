var mongoose  = require('mongoose');

var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost/epic';

mongoose.connect(mongoUrl);
mongoose.connection.on('error',function(err){
  console.error(err);
  process.exit(101);
});

var Stat = require('./Stat');


var weekday=new Array(7);
weekday[0]="Sunday";
weekday[1]="Monday";
weekday[2]="Tuesday";
weekday[3]="Wednesday";
weekday[4]="Thursday";
weekday[5]="Friday";
weekday[6]="Saturday";


var group = {};

group.key = {'lHoD' : 1,'lDoW' : 1};

group.cond = {
  'mountain' : 'MtBrighton'
};

group.reduce = function(doc,out){
  if(doc.liftsPm > 1500 || doc.liftsPm < 0)
    return;

  var t = out.total + doc.liftsPm;
  if(isNaN(t))
    return;

  out.total = t;
  out.all.push(doc.liftsPm);
  out.count++;

  if(doc.liftsPm > out.max)
    out.max = doc.liftsPm;

  if(doc.liftsPm < out.min)
    out.min = doc.liftsPm;

};

group.initial = {
  total : 0,
  count : 0,
  all : [],
  max : 0,
  min : 10000,
};

group.finalize = function(out){
  out.mean = Math.round(out.total / out.count);
  out.all = out.all.sort(function(a,b){return a-b;});
  out.median = out.all[Math.ceil(out.all.length/2)];
};

function sortHour(a,b){
  if(a.lHoD > b.lHoD)
    return 1;

  if(a.lHoD < b.lHoD)
    return -1;

  if(a.lDoW > b.lDoW)
    return 1;

  if(a.lDoW < b.lDoW)
    return -1;

  return 0;
}

function show(results){
  results.forEach(function(r){
    console.log(weekday[r.lDoW],r.lHoD,r.mean,r.median,r.min,r.max)
    //console.log(r);
  })
}

Stat.collection.group(group.key,
                      group.cond,
                      group.initial,
                      group.reduce,
                      group.finalize,
                      true,
                      {},
function(err,results){
  results = results.sort(sortHour);
  show(results);
  //console.log(results)
});