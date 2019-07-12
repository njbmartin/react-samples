
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import { actions, actionCreators, configure, propertiesReducer, nextItem, populateProperties, updateProperties } from './properties.redux'
import loadImage from '../utils/load-image'
import { getItem, setItem } from '../utils/local-storage'
import { getConfiguration, getProperties } from '../utils/api'

jest.mock('../utils/load-image')
jest.mock('../utils/local-storage')
jest.mock('../utils/api')

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('action creators', () => {
  it('should set configuration', () => {
    const branchId = 123
    const tvId = 'abc'

    const expectedAction = {
      type: actions.SET_CONFIGURATION,
      payload: {
        branchId, tvId
      }
    }

    expect(actionCreators.setConfiguration({ branchId, tvId })).toEqual(expectedAction)
  })

  it('should set current', () => {
    const current = 123
    const currentProperty = {
      name: 'test'
    }

    const expectedAction = {
      type: actions.SET_CURRENT,
      payload: {
        current,
        currentProperty
      }
    }

    expect(actionCreators.setCurrent(current, currentProperty)).toEqual(expectedAction)
  })

  it('should set properties', () => {
    const properties = [
      {
        id: 1
      },
      {
        id: 2
      }
    ]

    const expectedAction = {
      type: actions.SET_PROPERTIES,
      payload: properties
    }

    expect(actionCreators.setProperties(properties)).toEqual(expectedAction)
  })

  it('should set ready', () => {
    const expectedAction = {
      type: actions.SET_READY
    }

    expect(actionCreators.setReady()).toEqual(expectedAction)
  })
})

describe('reducer', () => {
  it('should return initial state', () => {
    const expectedState = {
      branchId: null,
      current: 0,
      currentProperty: null,
      duration: 10,
      properties: [],
      ready: false,
      refresh: 120,
      tvId: null
    }

    expect(propertiesReducer(undefined, {})).toEqual(expectedState)
  })

  it('should handle SET_CONFIGURATION', () => {
    const branchId = 1
    const tvId = 2
    const action = actionCreators.setConfiguration({ branchId, tvId })
    const expectedState = {
      branchId,
      tvId
    }
    expect(propertiesReducer({}, action)).toEqual(expectedState)
  })

  it('should handle SET_CURRENT', () => {
    const current = 123
    const currentProperty = {
      id: 123
    }
    const action = actionCreators.setCurrent(current, currentProperty)
    const expectedState = {
      current,
      currentProperty
    }
    expect(propertiesReducer({}, action)).toEqual(expectedState)
  })

  it('should handle SET_PROPERTIES', () => {
    const properties = [{
      id: 1
    },
    {
      id: 2
    }]
    const action = actionCreators.setProperties(properties)
    const expectedState = {
      properties
    }
    expect(propertiesReducer({}, action)).toEqual(expectedState)
  })
  it('should handle SET_READY', () => {
    const action = actionCreators.setReady()
    const expectedState = {
      ready: true
    }
    expect(propertiesReducer({}, action)).toEqual(expectedState)
  })
})

describe('action dispatcher', () => {
  afterEach(() => {
    loadImage.mockClear()
    getItem.mockClear()
  })

  beforeEach(() => {
    loadImage.mockImplementation((image) => {
      if (image === 'test.jpg') {
        return Promise.resolve()
      }
      throw new Error('image not found')
    })
  })

  describe('configure', () => {
    it('should call setConfiguration', () => {
      const branchId = 1
      const tvId = 2
      const name = 'TestTV'
      const duration = 7
      const refresh = 7200
      const store = mockStore({})
      const expectedActions = [
        { type: actions.SET_CONFIGURATION, payload: { branchId, tvId } },
        { type: actions.SET_CONFIGURATION, payload: { branchId, tvId, duration, name, refresh } }
      ]
      getConfiguration.mockImplementationOnce(() => Promise.resolve({
        name,
        duration,
        refresh
      }))
      return store.dispatch(configure(branchId, tvId))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })

  describe('nextItem', () => {
    it('should handle single item', () => {
      const mockProperty = {
        images: ['test.jpg', 'test.jpg']
      }
      const mockCurrent = 0
      const mockPropertyStore = {
        current: mockCurrent,
        properties: [mockProperty]
      }

      const store = mockStore({ property: mockPropertyStore })

      const expectedActions = [
        { type: actions.SET_CURRENT,
          payload: {
            current: mockCurrent,
            currentProperty: mockProperty
          }
        }
      ]

      return store.dispatch(nextItem())
        .then(() => {
          expect(loadImage).toHaveBeenCalledTimes(2)
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    it('should move to next property in nextItem', () => {
      const mockCurrentProperty = {
        images: ['test.jpg', 'test.jpg']
      }
      const mockNextProperty = {
        images: ['test.jpg']
      }
      const mockPropertyStore = {
        current: 0,
        properties: [
          mockCurrentProperty,
          mockNextProperty
        ]
      }

      const store = mockStore({ property: mockPropertyStore })

      const expectedActions = [
        { type: actions.SET_CURRENT,
          payload: {
            current: 1,
            currentProperty: mockNextProperty
          }
        }
      ]

      return store.dispatch(nextItem())
        .then(() => {
          expect(loadImage).toHaveBeenCalledTimes(1)
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
    it('should throw when an image does not exist', (done) => {
      const property = {
        current: 0,
        properties: [{
          images: ['test.jpg', 'missing.jpg', 'test.jpg']
        }]
      }
      const store = mockStore({ property })
      loadImage.mockImplementation((image) => {
        if (image === 'test.jpg') {
          return Promise.resolve()
        }
        throw new Error('image not found')
      })
      return store.dispatch(nextItem())
        .catch((err) => {
          expect(loadImage).toHaveBeenCalledTimes(2)
          expect(store.getActions()).toEqual([])
          expect(err.message).toEqual('image not found')
          done()
        })
    })
  })

  describe('populateProperties', () => {
    it('should call setProperties and set current if not exists', () => {
      const mockProperty = {
        images: ['test.jpg', 'test.jpg']
      }
      const properties = [mockProperty]

      getItem.mockImplementation(() => Promise.resolve(properties))
      const store = mockStore({ property: {} })
      const expectedActions = [
        { type: actions.SET_PROPERTIES, payload: properties },
        { type: actions.SET_CURRENT,
          payload: {
            current: 0,
            currentProperty: mockProperty
          }
        },
        { type: actions.SET_READY }
      ]
      return store.dispatch(populateProperties())
        .then(() => {
          expect(getItem).toHaveBeenCalledTimes(1)
          expect(getItem).toHaveBeenCalledWith('properties')
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    it('should call setProperties and not set current if one exists', () => {
      const properties = [{
        images: ['test.jpg', 'test.jpg']
      }]
      getItem.mockImplementation(() => Promise.resolve(properties))
      const store = mockStore({ property: { currentProperty: {} } })
      const expectedActions = [
        { type: actions.SET_PROPERTIES, payload: properties },
        { type: actions.SET_READY }
      ]
      return store.dispatch(populateProperties())
        .then(() => {
          expect(getItem).toHaveBeenCalledTimes(1)
          expect(getItem).toHaveBeenCalledWith('properties')
          expect(store.getActions()).toEqual(expectedActions)
        })
    })

    it('should not call setProperties if empty', () => {
      const properties = null
      getItem.mockImplementation(() => Promise.resolve(properties))
      const store = mockStore({})
      const expectedActions = []
      return store.dispatch(populateProperties())
        .then(() => {
          expect(getItem).toHaveBeenCalledTimes(1)
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })

  describe('updateProperties', () => {
    afterEach(() => {
      loadImage.mockClear()
      setItem.mockClear()
      getConfiguration.mockClear()
      getProperties.mockClear()
    })

    it('should load properties and store locally', () => {
      const branchId = 1
      const tvId = 2
      const mockProperties = {
        properties: [
          { images: ['test.jpg', 'test.jpg'] },
          { images: ['test.jpg', 'test.jpg'] }
        ]
      }
      getProperties.mockImplementationOnce(() => Promise.resolve(mockProperties))
      getItem
        .mockImplementationOnce(() => Promise.resolve([mockProperties.properties[0]]))
        .mockImplementationOnce(() => Promise.resolve(mockProperties.properties))
      const store = mockStore({
        property: {
          branchId,
          tvId
        }
      })
      const expectedActions = [
        { type: actions.SET_PROPERTIES, payload: [mockProperties.properties[0]] },
        { type: actions.SET_CURRENT,
          payload: {
            current: 0,
            currentProperty: mockProperties.properties[0]
          }
        },
        { type: actions.SET_READY },
        { type: actions.SET_PROPERTIES, payload: mockProperties.properties },
        { type: actions.SET_CURRENT,
          payload: {
            current: 0,
            currentProperty: mockProperties.properties[0]
          }
        },
        { type: actions.SET_READY }
      ]
      return store.dispatch(updateProperties())
        .then(() => {
          expect(setItem).toHaveBeenCalledTimes(3)
          expect(setItem).toHaveBeenCalledWith('properties', mockProperties.properties)
          expect(store.getActions()).toEqual(expectedActions)
        })
    })
  })
})
