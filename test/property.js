const Property = require('../lib/property')
const Schema = require('../lib/schema')
const Messages = require('../lib/messages')
const ValidationError = require('../lib/error');

describe('Property', () => {
  test('should have a .name property', () => {
    const prop = new Property('test', new Schema())
    expect(prop.name).toBe('test')
  })

  describe('.message()', () => {
    test('should register messages', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.message({ required: 'hello' })
      expect(prop.validate(null).message).toBe('hello')
    })

    test('should accept a string as a default message', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.type('string')
      prop.message('hello')
      expect(prop.validate('').message).toBe('hello')
      expect(prop.validate(null).message).toBe('hello')
    })

    test('should fall back to default error messages', () => {
      const prop = new Property('test', new Schema())
      const message = Messages.required(prop.name, {}, true)
      prop.message({ type: 'hello' })
      prop.type('string');
      prop.required()
      expect(prop.validate('').message).toBe(message)
      expect(prop.validate(1).message).toBe('hello')
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.message('hello')).toBe(prop)
    })
  })

  describe('.use()', () => {
    test('should register each object property as a validator', () => {
      const prop = new Property('test', new Schema())
      prop.use({
        one: (v) => v != 1,
        two: (v) => v != 2
      })
      expect(prop.validate(1)).toBeInstanceOf(Error)
      expect(prop.validate(2)).toBeInstanceOf(Error)
      expect(prop.validate(3)).toBe(false)
    })

    test('should use property names to look up error messages', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)

      schema.message({
        one: () => 'error 1',
        two: () => 'error 2'
      })

      prop.use({
        one: (v) => v != 1,
        two: (v) => v != 2
      })

      expect(prop.validate(1).message).toBe('error 1')
      expect(prop.validate(2).message).toBe('error 2')
    })

    test('should register additional arguments', () => {
      const prop = new Property('test', new Schema())
      let first, second;
      prop.use({
        one: [(v, c, arg) => first = arg, 1],
        two: [(v, c, arg) => second = arg, 2]
      })
      prop.validate({ test: 1 })
      expect(first).toBe(1)
      expect(second).toBe(2)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.use({ one: () => {}})).toBe(prop)
    })
  })

  describe('.required()', () => {
    test('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      expect(prop.validate(null)).toBeInstanceOf(Error)
      expect(prop.validate(100)).toBe(false)
    })

    test('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const message = Messages.required(prop.name, {}, true)
      prop.required()
      expect(prop.validate(null).message).toBe(message)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.required()).toBe(prop)
    })
  })

  describe('.type()', () => {
    test('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop.validate(1)).toBeInstanceOf(Error)
      expect(prop.validate('test')).toBe(false)
      expect(prop.validate(null)).toBe(false)
    })

    test('should set the internal ._type property', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop._type).toBe('string')
    })

    test('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const message = Messages.type(prop.name, {}, 'string')
      prop.type('string')
      expect(prop.validate(1).message).toBe(message)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.type('number')).toBe(prop)
    })
  })

  describe('.match()', () => {
    test('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.match(/^abc$/)
      expect(prop.validate('cab')).toBeInstanceOf(Error)
      expect(prop.validate('abc')).toBe(false)
      expect(prop.validate(null)).toBe(false)
    })

    test('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const regexp = /^abc$/
      const message = Messages.match(prop.name, {}, regexp)
      prop.match(regexp)
      expect(prop.validate('cab').message).toBe(message)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.match(/abc/)).toBe(prop)
    })
  })

  describe('.length()', () => {
    test('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.length({ min: 2, max: 3 })
      expect(prop.validate('abcd')).toBeInstanceOf(Error)
      expect(prop.validate('a')).toBeInstanceOf(Error)
      expect(prop.validate('abc')).toBe(false)
      expect(prop.validate(null)).toBe(false)
    })

    test('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const rule = { max: 1 }
      const message = Messages.length(prop.name, {}, rule)
      prop.length(rule)
      expect(prop.validate('abc').message).toBe(message)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.length({})).toBe(prop)
    })
  })

  describe('.enum()', () => {
    test('should register a validator', () => {
      const prop = new Property('test', new Schema())
      prop.enum(['one', 'two'])
      expect(prop.validate('three')).toBeInstanceOf(Error)
      expect(prop.validate('one')).toBe(false)
      expect(prop.validate('two')).toBe(false)
      expect(prop.validate(null)).toBe(false)
    })

    test('should use the correct error message', () => {
      const prop = new Property('test', new Schema())
      const enums = ['one', 'two']
      const message = Messages.enum(prop.name, {}, enums)
      prop.enum(enums)
      expect(prop.validate('three').message).toBe(message)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.enum(['one', 'two'])).toBe(prop)
    })
  })


  describe('.schema()', () => {
    test('should mount given schema on parent schema ', () => {
      const schema1 = new Schema()
      const schema2 = new Schema({ world: { required: true }})
      const prop1 = schema1.path('hello')
      const prop2 = schema2.path('world')
      prop1.schema(schema2)
      expect(schema1.path('hello.world')).toBe(prop2)
    })

    test('should support chaining', () => {
      const schema = new Schema()
      const prop = new Property('test', new Schema())
      expect(prop.schema(schema)).toBe(prop)
    })
  })

  describe('.elements()', () => {
    test('should define paths for given array elements', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.elements([{ type: 'number' }, { type: 'string' }])
      expect(schema.path('test.0')._type).toBe('number')
      expect(schema.path('test.1')._type).toBe('string')
    })

    test('should work', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.elements([{ type: 'number' }, { type: 'string' }])
      expect(schema.validate({ test: [1, 'hello']})).toHaveLength(0)
      expect(schema.validate({ test: ['hello', 'hello']})).toHaveLength(1)
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.elements([])).toBe(prop)
    })
  })

  describe('.each()', () => {
    test('should define a new array path on the parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      prop.each({ type: 'number' })
      expect(schema.path('test.$')._type).toBe('number')
    })

    test('should support chaining', () => {
      const prop = new Property('test', new Schema())
      expect(prop.each({})).toBe(prop)
    })
  })

  describe('.typecast()', () => {
    test('should typecast given value to the type defined by ._type', () => {
      const prop = new Property('test', new Schema())
      prop.type('string')
      expect(prop.typecast(123)).toBe('123')
    })
  })

  describe('.validate()', () => {
    test('should validate using using registered validators', () => {
      const prop = new Property('test', new Schema())
      prop.required()
      prop.match(/^abc$/)
      expect(prop.validate(null)).toBeInstanceOf(Error)
      expect(prop.validate('abc')).toBe(false)
      expect(prop.validate('cab')).toBeInstanceOf(Error)
    })

    test('should run `required` and `type` validators first', () => {
      const schema = new Schema();
      const prop = new Property('test', schema)
      const done = {};
      let counter = 0;

      schema.validator({
        required: () => done.required = ++counter,
        type: () => done.type = ++counter,
        match: () => done.match = ++counter,
        enum: () => done.enum = ++counter
      })

      prop.match()
      prop.enum()
      prop.type()
      prop.required()
      prop.validate('something')

      expect(done.required).toBe(1)
      expect(done.type).toBe(2)
    })

    test('should return a ValidationError', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      expect(prop.validate(null)).toBeInstanceOf(ValidationError);
    })

    test('should assign errors a .path', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      expect(prop.validate(null).path).toBe('some.path')
    })

    test('should allow path to be overridden', () => {
      const prop = new Property('some.path', new Schema())
      prop.required()
      expect(prop.validate(null, {}, 'some.other.path').path).toBe('some.other.path')
    })

    test('should pass context to validators', () => {
      const prop = new Property('test', new Schema())
      const obj = { hello: 'world' }
      let ctx;

      prop.use({
        context: (v, c) => {
          ctx = c
        }
      })

      prop.validate('abc', obj)
      expect(obj).toBe(ctx)
    })

    test('should pass path to validators', () => {
      const prop = new Property('test', new Schema())
      let path

      prop.use({
        context: (v, c, p) => {
          path = p
        }
      })

      prop.validate('abc', { test: 1 })
      expect(path).toBe('test')
    })
  })

  describe('.path()', () => {
    test('should proxy all arguments to parent schema', () => {
      const schema = new Schema()
      const prop = new Property('test', schema)
      const ret = prop.path('hello')
      expect(schema.path('hello')).toBe(ret)
    })
  })
})
