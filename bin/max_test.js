var mongoose  = require('mongoose');

var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost/epic';

mongoose.connect(mongoUrl);
mongoose.connection.on('error',function(err){
  console.error(err);
  process.exit(101);
});

var stats = require('../lib/stats');

stats.currentBusyIndex('MtBrighton',function(err,obj){
  console.log(err);
  console.log(obj)
});

