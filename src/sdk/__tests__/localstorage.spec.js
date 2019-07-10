import * as LocalStorage from '../localstorage'
import * as Identity from '../identity'
import * as ActivityState from '../activity-state'
import * as QuickStorage from '../quick-storage'
import * as Logger from '../logger'
import * as Scheme from '../scheme'

jest.mock('../logger')

describe('LocalStorage usage', () => {

  const storeNames = Scheme.default.names

  beforeAll(() => {
    jest.spyOn(Logger.default, 'error')
  })

  afterEach(() => {
    localStorage.clear()
  })

  afterAll(() => {
    LocalStorage.destroy()
    jest.restoreAllMocks()
  })

  it('checks if localStorage is supported', () => {

    const original = window.localStorage
    let supported = LocalStorage.isSupported()

    expect(supported).toBeTruthy()
    expect(Logger.default.error).not.toHaveBeenCalled()

    delete window.localStorage

    supported = LocalStorage.isSupported()
    expect(supported).toBeFalsy()
    expect(Logger.default.error).toHaveBeenCalledWith('LocalStorage is not supported in this browser')

    window.localStorage = original
  })

  it('returns rows from particular store', () => {

    expect.assertions(4)

    LocalStorage.getAll('test')
      .catch(error => {
        expect(error.name).toBe('NotFoundError')
        expect(error.message).toBe('No store named test in this storage')
      })

    LocalStorage.getAll(storeNames.queue)
      .then(result => {
        expect(result).toEqual([])
      })

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.queue] = [
      {timestamp: 1, url: '/url1'},
      {timestamp: 2, url: '/url2'},
      {timestamp: 3, url: '/url3'}
    ]

    LocalStorage.getAll(storeNames.queue)
      .then(result => {
        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 2, url: '/url2'},
          {timestamp: 3, url: '/url3'}
        ])
      })

  })

  it('returns undefined if no row present', () => {

    expect.assertions(1)

    return LocalStorage.getFirst(storeNames.activityState)
      .then(result => {
        expect(result).toBeUndefined()
      })

  })

  it('returns empty array if no rows present', () => {

    expect.assertions(1)

    return LocalStorage.getAll(storeNames.queue)
      .then(result => {
        expect(result).toEqual([])
      })

  })

  it('returns first row from particular store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.queue] = [
      {timestamp: 1552701608300, url: '/url1'},
      {timestamp: 1552705208300, url: '/url2'},
      {timestamp: 1552911178981, url: '/url3'},
    ]

    expect.assertions(1)

    return LocalStorage.getFirst(storeNames.queue)
      .then(result => {
        expect(result).toEqual({timestamp: 1552701608300, url: '/url1'})
      })

  })

  it('gets item from the activityState store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.activityState] = [
      {uuid: 1, lastActive: 12345},
      {uuid: 2, lastActive: 12346}
    ]

    expect.assertions(3)

    return LocalStorage.getItem(storeNames.activityState, 2)
      .then(result => {
        expect(result).toEqual({uuid: 2, lastActive: 12346})

        return LocalStorage.getItem(storeNames.activityState, 3)
      })
      .catch(error => {
        expect(error.name).toEqual('NotFoundError')
        expect(error.message).toEqual('No record found uuid => 3 in activityState store')
      })

  })

  it('gets item from the globalParams store - with composite key', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.globalParams] = [
      {key: 'key1', value: 'cvalue1', type: 'callback'},
      {key: 'key2', value: 'cvalue2', type: 'callback'},
      {key: 'key1', value: 'pvalue1', type: 'partner'}
    ]

    expect.assertions(3)

    return LocalStorage.getItem(storeNames.globalParams, ['key1', 'callback'])
      .then(result => {
        expect(result).toEqual({key: 'key1', value: 'cvalue1', type: 'callback'})

        return LocalStorage.getItem(storeNames.globalParams, ['key3', 'callback'])
      })
      .catch(error => {
        expect(error.name).toEqual('NotFoundError')
        expect(error.message).toEqual('No record found key:type => key3:callback in globalParams store')
      })

  })

  it('adds items to the queue store', () => {

    expect.assertions(8)

    return LocalStorage.addItem(storeNames.queue, {timestamp: 1, url: '/url1'})
      .then(id => {

        expect(id).toEqual(1)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'}
        ])

        return LocalStorage.addItem(storeNames.queue, {timestamp: 2, url: '/url2'})
      })
      .then(id => {

        expect(id).toEqual(2)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 2, url: '/url2'}
        ])

        return LocalStorage.addItem(storeNames.queue, {timestamp: 3, url: '/url3'})
      })
      .then(id => {

        expect(id).toEqual(3)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 2, url: '/url2'},
          {timestamp: 3, url: '/url3'}
        ])

        return LocalStorage.addItem(storeNames.queue, {timestamp: 2, url: '/url2'})
      })
      .catch(error => {
        expect(error.name).toBe('ConstraintError')
        expect(error.message).toBe('Item timestamp => 2 already exists')
      })

  })

  it('adds items to the globalParams store - with composite key', () => {

    expect.assertions(8)

    return LocalStorage.addItem(storeNames.globalParams, {key: 'key1', value: 'value1', type: 'callback'})
      .then((id) => {

        expect(id).toEqual(['key1', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'}
        ])

        return LocalStorage.addItem(storeNames.globalParams, {key: 'key2', value: 'value2', type: 'callback'})
      })
      .then(id => {

        expect(id).toEqual(['key2', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'}
        ])

        return LocalStorage.addItem(storeNames.globalParams, {key: 'key1', value: 'value1', type: 'partner'})
      })
      .then(id => {

        expect(id).toEqual(['key1', 'partner'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'}
        ])

        return LocalStorage.addItem(storeNames.globalParams, {key: 'key1', value: 'value1', type: 'callback'})
      })
      .catch(error => {
        expect(error.name).toBe('ConstraintError')
        expect(error.message).toBe('Item key:type => key1:callback already exists')
      })

  })

  it('updates items in the activityState store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.activityState] = [
      {uuid: 1, lastActive: 12345},
      {uuid: 2, lastActive: 12346}
    ]

    expect.assertions(8)

    return LocalStorage.updateItem(storeNames.activityState, {uuid: 1, lastActive: 12347, attribution: {adid: 'something'}})
      .then(update => {

        expect(update).toEqual(1)

        return LocalStorage.getAll(storeNames.activityState)
      })
      .then(result => {

        expect(result).toEqual([
          {uuid: 1, lastActive: 12347, attribution: {adid: 'something'}},
          {uuid: 2, lastActive: 12346}
        ])

        return LocalStorage.updateItem(storeNames.activityState, {uuid: 1, lastActive: 12348})
      })
      .then(update => {

        expect(update).toEqual(1)

        return LocalStorage.getItem(storeNames.activityState, 1)
      })
      .then(result => {

        expect(result).toEqual({uuid: 1, lastActive: 12348})

        return LocalStorage.updateItem(storeNames.activityState, {uuid: 2, lastActive: 12349, attribution: {adid: 'something'}})
      })
      .then(update => {

        expect(update).toEqual(2)

        return LocalStorage.getAll(storeNames.activityState)
      })
      .then(result => {

        expect(result).toEqual([
          {uuid: 1, lastActive: 12348},
          {uuid: 2, lastActive: 12349, attribution: {adid: 'something'}}
        ])

        return LocalStorage.updateItem(storeNames.activityState, {uuid: 3, lastActive: 12350})
      })
      .then(update => {

        expect(update).toEqual(3)

        return LocalStorage.getAll(storeNames.activityState)
      })
      .then(result => {

        expect(result).toEqual([
          {uuid: 1, lastActive: 12348},
          {uuid: 2, lastActive: 12349, attribution: {adid: 'something'}},
          {uuid: 3, lastActive: 12350}
        ])
      })

  })

  it('updates items in the globalParams store - with composite key', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.globalParams] = [
      {key: 'key1', value: 'value1', type: 'callback'},
      {key: 'key2', value: 'value2', type: 'callback'},
      {key: 'key1', value: 'value1', type: 'partner'}
    ]

    expect.assertions(6)

    return LocalStorage.updateItem(storeNames.globalParams, {key: 'key1', value: 'updated value1', type: 'callback'})
      .then(update => {

        expect(update).toEqual(['key1', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'updated value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'}
        ])

        return LocalStorage.updateItem(storeNames.globalParams, {key: 'key2', value: 'updated value2', type: 'callback'})
      })
      .then(update => {

        expect(update).toEqual(['key2', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'updated value1', type: 'callback'},
          {key: 'key2', value: 'updated value2', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'}
        ])

        return LocalStorage.updateItem(storeNames.globalParams, {key: 'key2', value: 'value2', type: 'partner'})
      })
      .then(update => {

        expect(update).toEqual(['key2', 'partner'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {
        expect(result).toEqual([
          {key: 'key1', value: 'updated value1', type: 'callback'},
          {key: 'key2', value: 'updated value2', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])
      })

  })

  it('deletes item by item in the queue store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.queue] = [
      {timestamp: 1, url: '/url1'},
      {timestamp: 2, url: '/url2'},
      {timestamp: 3, url: '/url3'},
      {timestamp: 4, url: '/url4'}
    ]

    expect.assertions(6)

    return LocalStorage.deleteItem(storeNames.queue, 2)
      .then(deleted => {

        expect(deleted).toEqual(2)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 3, url: '/url3'},
          {timestamp: 4, url: '/url4'}
        ])

        return LocalStorage.deleteItem(storeNames.queue, 4)
      })
      .then(deleted => {

        expect(deleted).toEqual(4)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 3, url: '/url3'}
        ])

        return LocalStorage.deleteItem(storeNames.queue, 5)
      })
      .then(deleted => {

        expect(deleted).toEqual(5)

        return LocalStorage.getAll(storeNames.queue)
      })
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 3, url: '/url3'}
        ])
      })

  })

  it('deletes item by item in the globalParams store - with composite key', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.globalParams] = [
      {key: 'key1', value: 'value1', type: 'callback'},
      {key: 'key2', value: 'value2', type: 'callback'},
      {key: 'key1', value: 'value1', type: 'partner'},
      {key: 'key2', value: 'value2', type: 'partner'}
    ]

    expect.assertions(6)

    return LocalStorage.deleteItem(storeNames.globalParams, ['key2', 'callback'])
      .then(deleted => {

        expect(deleted).toEqual(['key2', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])

        return LocalStorage.deleteItem(storeNames.globalParams, ['key1', 'partner'])
      })
      .then(deleted => {

        expect(deleted).toEqual(['key1', 'partner'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])

        return LocalStorage.deleteItem(storeNames.globalParams, ['key5', 'callback'])
      })
      .then(deleted => {

        expect(deleted).toEqual(['key5', 'callback'])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {

        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])
      })

  })

  it ('deletes items until certain bound from the queue store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.queue] = [
      {timestamp: 1552701608300, url: '/url1'},
      {timestamp: 1552705208300, url: '/url2'},
      {timestamp: 1552911178981, url: '/url3'},
    ]

    expect.assertions(3)

    return LocalStorage.getAll(storeNames.queue)
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1552701608300, url: '/url1'},
          {timestamp: 1552705208300, url: '/url2'},
          {timestamp: 1552911178981, url: '/url3'}
        ])

        return LocalStorage.deleteBulk(storeNames.queue, {upperBound: 1552705208300})
      })
      .then(deleted => {
        expect(deleted).toEqual([
          {timestamp: 1552701608300, url: '/url1'},
          {timestamp: 1552705208300, url: '/url2'},
        ])
      })
      .then(() => LocalStorage.getAll(storeNames.queue))
      .then(result => {
        expect(result).toEqual([
          {timestamp: 1552911178981, url: '/url3'}
        ])
      })

  })

  it ('deletes items in bulk by type from the globalParams store - with composite key', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.globalParams] = [
      {key: 'key4', value: 'value4', type: 'callback'},
      {key: 'key2', value: 'value2', type: 'callback'},
      {key: 'key2', value: 'value2', type: 'partner'},
      {key: 'key3', value: 'value3', type: 'callback'},
      {key: 'key1', value: 'value1', type: 'partner'},
      {key: 'key1', value: 'value1', type: 'callback'}
    ]

    expect.assertions(5)

    return LocalStorage.getAll(storeNames.globalParams)
      .then(result => {
        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'},
          {key: 'key3', value: 'value3', type: 'callback'},
          {key: 'key4', value: 'value4', type: 'callback'},
          {key: 'key1', value: 'value1', type: 'partner'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])

        return LocalStorage.deleteBulk(storeNames.globalParams, 'partner')
      })
      .then(deleted => {
        expect(deleted).toEqual([
          {key: 'key1', value: 'value1', type: 'partner'},
          {key: 'key2', value: 'value2', type: 'partner'}
        ])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {
        expect(result).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'},
          {key: 'key3', value: 'value3', type: 'callback'},
          {key: 'key4', value: 'value4', type: 'callback'}
        ])

        return LocalStorage.deleteBulk(storeNames.globalParams, 'callback')
      })
      .then(deleted => {
        expect(deleted).toEqual([
          {key: 'key1', value: 'value1', type: 'callback'},
          {key: 'key2', value: 'value2', type: 'callback'},
          {key: 'key3', value: 'value3', type: 'callback'},
          {key: 'key4', value: 'value4', type: 'callback'}
        ])

        return LocalStorage.getAll(storeNames.globalParams)
      })
      .then(result => {
        expect(result).toEqual([])
      })

  })

  it('clears items from the queue store', () => {

    // prepare some rows manually
    QuickStorage.default.stores[storeNames.queue] = [
      {timestamp: 1, url: '/url1'},
      {timestamp: 2, url: '/url2'}
    ]

    expect.assertions(2)

    return LocalStorage.getAll(storeNames.queue)
      .then(result => {

        expect(result).toEqual([
          {timestamp: 1, url: '/url1'},
          {timestamp: 2, url: '/url2'}
        ])

        return LocalStorage.clear(storeNames.queue)
      })
      .then(() => LocalStorage.getAll(storeNames.queue))
      .then(result => {
        expect(result).toEqual([])
      })

  })

  it('restores activityState record from the running memory when db gets destroyed', () => {

    let activityState = null

    return Identity.start()
      .then(() => {

        LocalStorage.destroy()
        localStorage.clear()

        activityState = ActivityState.default.current

        expect(activityState.uuid).toBeDefined()

        return LocalStorage.getFirst(storeNames.activityState)
      })
      .then(stored => {

        expect(stored).toEqual(activityState)
        expect(stored.uuid).toBeDefined()

        Identity.destroy()
      })

  })

  describe('performing add bulk operation', () => {

    it('fails when array is not provided', () => {

      expect.assertions(4)

      return LocalStorage.addBulk(storeNames.globalParams, [])
        .catch(error => {
          expect(error.name).toEqual('NoTargetDefined')
          expect(error.message).toEqual('No array provided to perform add bulk operation into globalParams store')

          return LocalStorage.addBulk(storeNames.queue)
        })
        .catch(error => {
          expect(error.name).toEqual('NoTargetDefined')
          expect(error.message).toEqual('No array provided to perform add bulk operation into queue store')
        })

    })

    it('adds rows into globalParams store', () => {

      const globalParamsSet1 = [
        {key: 'bla', value: 'truc', type: 'callback'},
        {key: 'key1', value: 'value1', type: 'callback'},
        {key: 'eto', value: 'tako', type: 'partner'}
      ]

      const globalParamsSet2 = [
        {key: 'key2', value: 'value2', type: 'callback'},
        {key: 'par', value: 'tner', type: 'partner'}
      ]

      expect.assertions(3)

      return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet1)
        .then(result => {
          expect(result).toEqual([['bla', 'callback'], ['key1', 'callback'], ['eto', 'partner']])

          return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet2)
        })
        .then(result => {
          expect(result).toEqual([['key2', 'callback'], ['par', 'partner']])

          return LocalStorage.getAll(storeNames.globalParams)
        })
        .then(result => {
          expect(result).toEqual([
            {key: 'bla', value: 'truc', type: 'callback'},
            {key: 'key1', value: 'value1', type: 'callback'},
            {key: 'key2', value: 'value2', type: 'callback'},
            {key: 'eto', value: 'tako', type: 'partner'},
            {key: 'par', value: 'tner', type: 'partner'}
          ])
        })

    })

    it('adds rows into globalParams store and overwrite existing key at later point', () => {

      const globalParamsSet1 = [
        {key: 'bla', value: 'truc', type: 'callback'},
        {key: 'key1', value: 'value1', type: 'callback'},
        {key: 'eto', value: 'tako', type: 'partner'}
      ]

      const globalParamsSet2 = [
        {key: 'key1', value: 'new key1 value', type: 'callback'},
        {key: 'par', value: 'tner', type: 'partner'},
        {key: 'bla', value: 'truc', type: 'partner'}
      ]

      expect.assertions(3)

      return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet1)
        .then(result => {
          expect(result).toEqual([['bla', 'callback'], ['key1', 'callback'], ['eto', 'partner']])

          return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet2, true)
        })
        .then(result => {
          expect(result).toEqual([['key1', 'callback'], ['par', 'partner'], ['bla', 'partner']])

          return LocalStorage.getAll(storeNames.globalParams)
        })
        .then(result => {
          expect(result).toEqual([
            {key: 'bla', value: 'truc', type: 'callback'},
            {key: 'key1', value: 'new key1 value', type: 'callback'},
            {key: 'bla', value: 'truc', type: 'partner'},
            {key: 'eto', value: 'tako', type: 'partner'},
            {key: 'par', value: 'tner', type: 'partner'}
          ])
        })
    })

    it('adds rows into globalParams store and catches error when adding existing key', () => {

      const globalParamsSet1 = [
        {key: 'bla', value: 'truc', type: 'callback'},
        {key: 'key1', value: 'value1', type: 'callback'},
        {key: 'eto', value: 'tako', type: 'partner'}
      ]

      const globalParamsSet2 = [
        {key: 'key1', value: 'new key1 value', type: 'callback'},
        {key: 'par', value: 'tner', type: 'partner'},
        {key: 'eto', value: 'tako', type: 'partner'}
      ]

      expect.assertions(3)

      return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet1)
        .then(result => {
          expect(result).toEqual([['bla', 'callback'], ['key1', 'callback'], ['eto', 'partner']])

          return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet2)
        })
        .catch(error => {
          expect(error.name).toEqual('ConstraintError')
          expect(error.message).toEqual('Items with key:type => key1:callback,eto:partner already exist')
        })

    })

    it('returns callback and partner params from the globalParams store', () => {

      const globalParamsSet = [
        {key: 'key1', value: 'value1', type: 'callback'},
        {key: 'key2', value: 'value2', type: 'partner'},
        {key: 'key3', value: 'value3', type: 'partner'},
        {key: 'key4', value: 'value4', type: 'callback'},
        {key: 'key5', value: 'value5', type: 'callback'},
      ]

      expect.assertions(2)

      return LocalStorage.addBulk(storeNames.globalParams, globalParamsSet)
        .then(() => Promise.all([
          LocalStorage.filterBy(storeNames.globalParams, 'callback'),
          LocalStorage.filterBy(storeNames.globalParams, 'partner')
        ]))
        .then(([callbackParams, partnerParams]) => {
          expect(callbackParams).toEqual([
            {key: 'key1', value: 'value1', type: 'callback'},
            {key: 'key4', value: 'value4', type: 'callback'},
            {key: 'key5', value: 'value5', type: 'callback'},
          ])
          expect(partnerParams).toEqual([
            {key: 'key2', value: 'value2', type: 'partner'},
            {key: 'key3', value: 'value3', type: 'partner'}
          ])
        })
    })

  })

})
