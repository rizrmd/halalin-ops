import * as React from 'react'

interface DebouncedSearchInputProps {
  defaultValue: string
  delay?: number
  placeholder?: string
  style?: React.CSSProperties
  onValueChange: (value: string) => void
}

export function DebouncedSearchInput({
  defaultValue,
  delay = 350,
  placeholder,
  style,
  onValueChange,
}: DebouncedSearchInputProps) {
  const [value, setValue] = React.useState(defaultValue)
  const emitValueChange = React.useEffectEvent(onValueChange)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(emitValueChange, delay, value)
    return () => window.clearTimeout(timeoutId)
  }, [delay, value])

  return (
    <input
      type="search"
      value={value}
      onChange={event => setValue(event.target.value)}
      placeholder={placeholder}
      style={style}
    />
  )
}
