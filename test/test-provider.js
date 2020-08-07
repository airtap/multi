'use strict'

const Provider = require('browser-provider').promises

module.exports = class TestProvider extends Provider {
  async _manifests () {
    return this.options.mocks || [
      { name: 'test1' },
      { name: 'test2' }
    ]
  }

  _browser (manifest, target) {
    return { manifest }
  }
}
