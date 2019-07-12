import { getProperties, getConfiguration } from '../utils/api'
import { getItem, setItem } from '../utils/local-storage'
import loadImage from '../utils/load-image'

const actions = {
  LIST_PROPERTIES: 'PROPERTIES/LIST_PROPERTIES',
  SAVE_PROPERTIES: 'PROPERTIES/SAVE_PROPERTIES',
  SET_CONFIGURATION: 'PROPERTIES/SET_CONFIGURATION',
  SET_CURRENT: 'PROPERTIES/SET_CURRENT',
  SET_PROPERTIES: 'PROPERTIES/SET_PROPERTIES',
  SET_READY: 'PROPERTIES/SET_READY'
}

const initialState = {
  branchId: null,
  current: 0,
  currentProperty: null,
  duration: 10,
  properties: [],
  ready: false,
  refresh: 120,
  tvId: null
}

const configure = (branchId, tvId) => (dispatch) => {
  dispatch(setConfiguration({ branchId, tvId }))
  return getConfiguration(branchId, tvId)
    .then(config => {
      const combinedConfig = {
        branchId,
        tvId,
        ...config
      }
      dispatch(setConfiguration(combinedConfig))
      return setItem('config', combinedConfig).then(() => {
      })
    }).catch(() => {
      return getItem('config').then((config) => {
        if (!config) return
        dispatch(setConfiguration(config))
      })
    })
}

const nextItem = () => (dispatch, getState) => {
  const { property: { current, properties } } = getState()
  const next = current < (properties.length - 1) ? current + 1 : 0
  const nextProperty = properties[next]
  const { images } = nextProperty
  return images.reduce((previousImage, image) =>
    previousImage.then(() =>
      loadImage(image)
    ), Promise.resolve())
    .then(() => dispatch(setCurrent(next, nextProperty)))
}

const populateProperties = () => (dispatch, getState) => {
  return getItem('properties').then((properties) => {
    if (!properties) return
    const { property: { currentProperty } } = getState()
    dispatch(setProperties(properties))
    if (!currentProperty) {
      dispatch(setCurrent(0, properties[0]))
    }
    dispatch(setReady())
  })
}

const updateProperties = () => (dispatch, getState) => {
  const { property: { branchId, tvId } } = getState()
  const loadedProperties = []
  return getProperties(branchId, tvId).then(({ properties }) =>
    properties.reduce((previous, property) =>
      previous.then(() => {
        const { images } = property
        return images.reduce((previousImage, image) =>
          previousImage.then(() =>
            loadImage(image)
          ), Promise.resolve())
          .then(() => {
            loadedProperties.push(property)

            return setItem('properties', loadedProperties).then(() => {
              return dispatch(populateProperties())
            })
          })
      }), Promise.resolve())
  ).catch(err => {
    console.log(err)
    dispatch(populateProperties())
  })
}

const setProperties = (properties) => ({
  type: actions.SET_PROPERTIES,
  payload: properties
})

const setConfiguration = (config) => ({
  type: actions.SET_CONFIGURATION,
  payload: config
})

const setCurrent = (current, currentProperty) => ({
  type: actions.SET_CURRENT,
  payload: {
    current,
    currentProperty
  }
})

const setReady = () => ({
  type: actions.SET_READY
})

const actionCreators = {
  setConfiguration,
  setCurrent,
  setProperties,
  setReady
}

const propertiesReducer = (state = initialState, action) => {
  const { payload } = action
  switch (action.type) {
    case actions.SET_CONFIGURATION: {
      const {
        branchId,
        duration = state.duration,
        refresh = state.refresh,
        tvId
      } = payload

      return {
        ...state,
        branchId,
        duration,
        refresh,
        tvId
      }
    }
    case actions.SET_CURRENT: {
      const { current, currentProperty } = payload
      return {
        ...state,
        current,
        currentProperty
      }
    }
    case actions.SET_PROPERTIES: {
      return {
        ...state,
        properties: payload
      }
    }
    case actions.SET_READY: {
      return {
        ...state,
        ready: true
      }
    }
    default:
      return state
  }
}

export {
  actions,
  actionCreators,
  configure,
  nextItem,
  updateProperties,
  populateProperties,
  propertiesReducer
}
