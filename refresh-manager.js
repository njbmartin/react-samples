import React, { Component, Fragment } from 'react'
import PropType from 'prop-types'

class RefreshManager extends Component {
  componentDidMount () {
    const { duration, refreshAction } = this.props

    const durationMs = duration * 1000
    this.refreshPolling = setInterval(
      () => {
        refreshAction()
      }, durationMs)
  }

  componentWillUnmount () {
    clearInterval(this.refreshPolling)
  }

  render () {
    return <Fragment />
  }
}

RefreshManager.propTypes = {
  duration: PropType.number.isRequired,
  refreshAction: PropType.func.isRequired
}

RefreshManager.defaultProps = {
  duration: 2
}

export default RefreshManager
