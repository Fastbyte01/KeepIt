var stream = require('readable-stream')
  , util   = require('util');


module.exports = BatchStream;


function BatchStream (options) {
  if (!(this instanceof BatchStream)) return new BatchStream(options);
  
  options || (options = {});

  var transformOptions = {
    objectMode: true
  }
  if(options.highWaterMark !== undefined) {
    transformOptions.highWaterMark = options.highWaterMark
  }

  stream.Transform.call(this, transformOptions);
  this.size  = options.size || 100;
  this.batch = [];
}
util.inherits(BatchStream, stream.Transform);


BatchStream.prototype._transform = function (chunk, encoding, callback) {
  this.batch.push(chunk);
  if (this.batch.length >= this.size) {
    this.push(this.batch);
    this.batch = [];
  }
  callback();
};


BatchStream.prototype._flush = function (callback) {
  if (this.batch.length) {
    this.push(this.batch);
    this.batch = [];
  }
  callback();
};

