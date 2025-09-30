import React from 'react'

const error = ({message}) => {
  return (
    <span className='text-red-500 text-sm'>
      {message}
    </span>
  )
}

export default error
