import localforage from 'localforage'
import { getItem, removeItem, setItem } from './local-storage'

jest.mock('localforage')

describe('local storage', () => {
  let mockData = {
    'test': {
      message: 'test'
    }
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should get local storage', () => {
    localforage.getItem.mockResolvedValue(mockData)

    return getItem('test').then(data => {
      expect(localforage.getItem).toHaveBeenCalledWith('test')
      expect(data).toEqual({ test: { message: 'test' } })
    })
  })

  it('should set local storage if key does not exist already', () => {
    let existingData = {
      existing: 'unaffected'
    }

    let mockSetData = {
      ...existingData
    }

    localforage.setItem.mockImplementation((key, value) => {
      mockSetData = { ...mockSetData, [key]: value }
      return Promise.resolve(mockSetData)
    })

    return setItem('new', { data: 'new' }).then(() => {
      expect(localforage.setItem).toHaveBeenCalledWith('new', { data: 'new' })
      expect(mockSetData).toEqual({ existing: 'unaffected', new: { data: 'new' } })
    })
  })

  it('should set local storage and replace if the key already exists', () => {
    let mockSetData = {
      existing: 'unaffected',
      replace: {
        data: 'old',
        vanishes: true
      }
    }

    localforage.setItem.mockImplementation((key, value) => {
      mockSetData = { ...mockSetData, [key]: value }
      return Promise.resolve(mockSetData)
    })

    return setItem('replace', { data: 'new' }).then(() => {
      expect(localforage.setItem).toHaveBeenCalledWith('replace', { data: 'new' })
      expect(mockSetData).toEqual({ existing: 'unaffected', replace: { data: 'new' } })
    })
  })

  it('should remove local storage', () => {
    let mockSetData = {
      existing: 'unaffected',
      remove: {
        data: 'old',
        vanishes: true
      }
    }

    localforage.removeItem.mockImplementation((key) => {
      delete mockSetData[key]
      return Promise.resolve(mockSetData)
    })

    return removeItem('remove').then(() => {
      expect(localforage.removeItem).toHaveBeenCalledWith('remove')
      expect(mockSetData).toEqual({ existing: 'unaffected' })
    })
  })
})
