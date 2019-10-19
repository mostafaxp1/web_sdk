import * as Logger from '../logger'

jest.mock('../logger')

describe('test global config', () => {
  describe('test environment', () => {
    jest.isolateModules(() => {
      const Config = require('../config')

      afterEach(() => {
        jest.clearAllMocks()
        Config.default.destroy()
      })

      afterAll(() => {
        jest.restoreAllMocks()
      })

      it('returns false for initialised state', () => {
        expect(Config.default.isInitialised()).toBeFalsy()
      })

      it('returns error when there are missing mandatory params', () => {

        jest.spyOn(Logger.default, 'error')

        Config.default.baseParams = {}

        expect(Logger.default.error).toHaveBeenCalledWith('You must define appToken and environment')
        expect(Config.default.isInitialised()).toBeFalsy()
        expect(Config.default.baseParams).toEqual({})

        Config.default.baseParams = {appToken: 'bla'}

        expect(Logger.default.error).toHaveBeenCalledWith('You must define environment')
        expect(Config.default.isInitialised()).toBeFalsy()
        expect(Config.default.baseParams).toEqual({})

      })

      it('returns true for correctly initialised state', () => {

        const appParams = {
          appToken: '123abc',
          environment: 'sandbox'
        }

        Config.default.baseParams = appParams

        expect(Config.default.isInitialised()).toBeTruthy()
        expect(Config.default.baseParams).toEqual(appParams)
        expect(Config.default.baseParams).not.toBe(appParams)
        expect(Config.default.baseUrl).toEqual({})
      })

      it('sets only allowed parameters', () => {

        Config.default.baseParams = {
          appToken: '123abc',
          environment: 'sandbox',
          defaultTracker: 'tracker',
          something: 'else'
        }

        expect(Config.default.isInitialised()).toBeTruthy()
        expect(Config.default.baseParams).toEqual({
          appToken: '123abc',
          environment: 'sandbox',
          defaultTracker: 'tracker',
        })

      })

      it('destroys config', () => {

        const appParams = {
          appToken: '123abc',
          environment: 'sandbox'
        }

        Config.default.baseParams = appParams

        expect(Config.default.isInitialised()).toBeTruthy()
        expect(Config.default.baseParams).toEqual(appParams)

        Config.default.destroy()

        expect(Config.default.isInitialised()).toBeFalsy()
        expect(Config.default.baseParams).toEqual({})
      })
    })
  })

  describe('development environment', () => {
    jest.isolateModules(() => {
      global.process.env.NODE_ENV = 'development'
      const Config = require('../config')

      it('sets base urls for env other then test', () => {
        expect(Config.default.baseUrl).toEqual({
          app: 'https://app.adjust.com',
          gdpr: 'https://gdpr.adjust.com'
        })
      })
    })
  })

})
