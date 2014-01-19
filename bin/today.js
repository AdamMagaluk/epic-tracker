var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/epic');

var Stat = require('./Stat');

var stream = Stat.find({mountain : 'Heavenly'}).sort({date : 1}).stream();

var total = 0;
stream.on('data', function (doc) {
  console.log(doc.date,doc.liftsDx)
  total+=doc.liftsDx;
    // do something with the mongoose document
}).on('error', function (err) {
  console.log(err);
  // handle the error
}).on('close', function () {
  // the stream is closed
  console.log(total)
  process.exit()
});