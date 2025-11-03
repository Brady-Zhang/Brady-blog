import { useRef, useEffect } from "react"

/**
 * Hook that executes a callback when the component unmounts.
 *
 * @param callback Function to be called on component unmount
 */
 
export const useUnmount = (
  // eslint-disable-next-line no-unused-vars
  callback: (...args: Array<any>) => any
) => {
  const ref = useRef(callback)
  ref.current = callback

  useEffect(
    () => () => {
      ref.current()
    },
    []
  )
}

export default useUnmount
