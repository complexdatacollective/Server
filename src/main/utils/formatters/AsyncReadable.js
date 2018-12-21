const { Readable } = require('stream');

/**
 * By wrapping read in a timeout, we allow exporters to interleave; otherwise,
 * they'll proceed in sequence. This makes progress tracking easier;
 * we could instead have exporters estimate their length ahead of time.
 *
 * Instantiate with the 'Simplified Constructor' approach in Readable:
 * ```
 * new AsyncReadable({ read() {} })
 * ```
 */
class AsyncReadable extends Readable {
  constructor(options) {
    super({ ...options, read: undefined });
    this.readSync = options.read.bind(this);
  }

  _read() {
    setTimeout(this.readSync, 0);
  }
}

module.exports = AsyncReadable;
