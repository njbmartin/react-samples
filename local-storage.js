import localforage from 'localforage'

const getItem = (key) => localforage.getItem(key)

const removeItem = (key) => localforage.removeItem(key)

const setItem = (key, value) => localforage.setItem(key, value)

export {
  getItem,
  removeItem,
  setItem
}
