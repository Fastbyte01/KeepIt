
Batch Stream
============

Transform stream which batches a bunch of input data into groups of specified size. Will emit arrays, so that you can deal with pieces of input asynchronously.

## Usage

```javascript

var batch = new BatchStream({ size : 5 });

stream
  .pipe(batch)
  .pipe(new ArrayStream()); // deals with array input from pipe.

```