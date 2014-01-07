var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

Date.prototype.getDOY = function() {
  var onejan = new Date(this.getFullYear(),0,1);
  return Math.ceil((this - onejan) / 86400000);
}

var schema = new Schema({
  date : {type : Date,default: Date.now},
  mountain : String,
  
  points : {type : Number, default : 0},
  pointsDx : {type : Number, default : 0},

  pins : {type : Number, default : 0},
  pinsDx : {type : Number, default : 0},

  lifts : {type : Number, default : 0},
  liftsDx : {type : Number, default : 0},

  photos : {type : Number, default : 0},
  photosDx : {type : Number, default : 0},

  DoW : Number,
  DoM : Number,
  HoD : Number,
  DoY : Number
});

schema.statics.StatNames = [
  'points',
  'pins',
  'lifts',
  'photos',
];

schema.statics.Mountains = ['MtBrighton',
                 'Vail',
                 'BeaverCreek',
                 'Breck',
                 'Keystone',
                 'Canyons',
                 'Heavenly',
                 'Northstar',
                 'Kirkwood',
                 'AftonAlps'];

var Stat = mongoose.model('EpicStat',schema);

schema.pre('save', function (next) {
  this.DoW = this.date.getDay();
  this.DoM = this.date.getDate();
  this.HoD = this.date.getHours();
  this.DoY = this.date.getDOY();

  var self = this;
  Stat.find({ mountain : this.mountain, date : {$lt : this.date} })
      .sort({date : -1})
      .limit(1)
      .exec(function(err,docs){
        if(err || docs.length < 1)
          return next();

        var s2 = docs[0];
        Stat.StatNames.forEach(function(k){
          self[k+'Dx'] = (self[k]-s2[k]);
        });
        next();
      });
});

module.exports = Stat;
