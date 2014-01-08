var mongoose = require('mongoose');

var mongoUrl = process.env.MONGOHQ_URL || 'mongodb://localhost/epic';
mongoose.connect(mongoUrl);

var Stat = require('./Stat');

var stream = Stat.find({}).sort({date : 1}).stream();

stream.on('data', function (doc) {
  stream.pause();
  doc.save(function(){
    console.log(doc.date,doc.lDate)
    stream.resume();
  });
  // do something with the mongoose document
}).on('error', function (err) {
  console.log(err);
  // handle the error
}).on('close', function () {
  // the stream is closed
  console.log('done')
  process.exit()
});