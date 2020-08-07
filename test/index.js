'use strict'

const test = require('tape')
const Provider = require('browser-provider').promises
const Multi = require('..')

const aliases = {
  test1: './test/test-provider',
  test2: './test/test-provider'
}

test('empty', function (t) {
  const m = new Multi()
  t.is(Array.from(m).length, 0)
  t.is(m.get('test1'), undefined)
  t.same(m.options, {})
  t.end()
})

test('set aliases', function (t) {
  const m = new Multi({ aliases })
  t.same(m.options, { aliases })
  t.end()
})

test('add(string)', async function (t) {
  const m = new Multi({ aliases })

  m.add('test1')
  t.is(Array.from(m).length, 1)
  t.same(Array.from(m.keys()), ['test1'])
  t.ok(Array.from(m.values()).every(Boolean))

  m.add('test2')
  t.is(Array.from(m).length, 2)
  t.same(Array.from(m.keys()), ['test1', 'test2'])
  t.ok(Array.from(m.values()).every(Boolean))

  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test2' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add([string])', async function (t) {
  const m = new Multi({ aliases })

  m.add(['test1', 'test2'])
  t.is(Array.from(m).length, 2)

  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test2' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add(string, options)', async function (t) {
  const m = new Multi({ aliases })

  m.add('test1', { mocks: [{ name: 'abc' }] })
  t.is(Array.from(m).length, 1)

  t.same(await m.manifests(), [
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test1' }
  ])
})

test('add([string], options)', async function (t) {
  const m = new Multi({ aliases })

  m.add(['test1', 'test2'], { mocks: [{ name: 'abc' }] })
  t.is(Array.from(m).length, 2)
  t.ok(m.get('test1').options !== m.get('test2').options, 'cloned options')

  t.same(await m.manifests(), [
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add(object)', async function (t) {
  const m = new Multi({ aliases })

  m.add({ test1: null, test2: { mocks: [{ name: 'abc' }] } })
  t.is(Array.from(m).length, 2)
  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add(object, options)', function (t) {
  const m = new Multi({ aliases })

  m.add({ test1: { a: 1, b: 2 } }, { a: 0 })
  t.is(Array.from(m).length, 1)
  t.same(m.get('test1').options, { a: 0, b: 2 })
  t.end()
})

test('add([object])', async function (t) {
  const m = new Multi({ aliases })

  m.add([{ test1: null }, { test2: { mocks: [{ name: 'abc' }] } }])
  t.is(Array.from(m).length, 2)
  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add([object], options)', function (t) {
  const m = new Multi({ aliases })

  m.add([{ test1: { a: 1, b: 2 } }, { test2: { b: 3 } }], { a: 0 })
  t.is(Array.from(m).length, 2)
  t.same(m.get('test1').options, { a: 0, b: 2 })
  t.same(m.get('test2').options, { a: 0, b: 3 })
  t.end()
})

test('add(function)', async function (t) {
  const m = new Multi()

  class Test1 extends Provider {
    constructor (options) {
      super(options)
      this.id = 'test1'
    }

    async _manifests () {
      return this.options.mocks || [
        { name: 'test1' },
        { name: 'test2' }
      ]
    }
  }

  class Test2 extends Test1 {
    constructor (options) {
      super(options)
      this.id = 'test2'
    }
  }

  m.add(Test1)
  t.is(Array.from(m).length, 1)
  t.same(Array.from(m.keys()), ['test1'])
  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' }
  ])

  m.add(Test2, { mocks: [{ name: 'abc' }] })
  t.is(Array.from(m).length, 2)
  t.same(Array.from(m.keys()), ['test1', 'test2'])
  t.same(await m.manifests(), [
    { name: 'test1', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'test2', supports: {}, wants: {}, options: {}, provider: 'test1' },
    { name: 'abc', supports: {}, wants: {}, options: {}, provider: 'test2' }
  ])
})

test('add(invalid)', function (t) {
  const m = new Multi()

  t.throws(() => m.add(Provider), /^TypeError: Provider must have a string id/)
  t.throws(() => m.add(123), /^TypeError: First argument must be/)
  t.end()
})

test('browser', async function (t) {
  const m = new Multi()

  class Test1 extends Provider {
    constructor (options) {
      super(options)
      this.id = 'test1'
    }

    async _manifests () {
      return [{ name: 'test1' }]
    }

    _browser (manifest, target) {
      t.same(manifest, {
        name: 'test1',
        supports: {},
        wants: {},
        options: {},
        provider: 'test1'
      })
      return { a: 123 }
    }
  }

  m.add(Test1)

  const manifest = (await m.manifests())[0]
  const browser = m.browser(manifest, { url: 'https://example.com' })

  t.same(browser, { a: 123 })
})
