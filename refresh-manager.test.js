import React from 'react'
import RefreshManager from './refresh-manager'
import renderer from 'react-test-renderer'

describe('Refresh Manager', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('renders correctly', () => {
    const refreshActionMock = jest.fn()

    const tree = renderer
      .create(<RefreshManager refreshAction={refreshActionMock} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  it('calls refreshAction using 2 second default', () => {
    const refreshActionMock = jest.fn()

    const tree = renderer
      .create(<RefreshManager refreshAction={refreshActionMock} />)
      .toJSON()

    jest.advanceTimersByTime(2000)

    expect(tree).toMatchSnapshot()
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 2000)
    expect(refreshActionMock).toHaveBeenCalledTimes(1)
  })

  it('calls refreshAction after 5 seconds', () => {
    const refreshActionMock = jest.fn()

    const tree = renderer
      .create(<RefreshManager refreshAction={refreshActionMock} duration={5} />)
      .toJSON()

    jest.advanceTimersByTime(5000)

    expect(tree).toMatchSnapshot()
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 5000)
    expect(refreshActionMock).toHaveBeenCalledTimes(1)
  })

  it('calls refreshAction twice after 10 seconds', () => {
    const refreshActionMock = jest.fn()

    const tree = renderer
      .create(<RefreshManager refreshAction={refreshActionMock} duration={5} />)
      .toJSON()

    jest.advanceTimersByTime(10000)

    expect(tree).toMatchSnapshot()
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 5000)
    expect(refreshActionMock).toHaveBeenCalledTimes(2)
  })

  it('clears timer if component unmounted', () => {
    const refreshActionMock = jest.fn()
    const instance = renderer
      .create(<RefreshManager refreshAction={refreshActionMock} />)

    const tree = instance
      .toJSON()

    instance.unmount()
    jest.advanceTimersByTime(10000)

    expect(tree).toMatchSnapshot()
    expect(setInterval).toHaveBeenCalledTimes(1)
    expect(clearInterval).toHaveBeenCalledTimes(1)
    expect(refreshActionMock).toHaveBeenCalledTimes(0)
  })
})
