import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { SelectorTarget } from "@/types/selector-preview.type"

type SelectorInputProps = {
  label: string
  value: string
  placeholder: string
  multiline?: boolean
  selectorTarget: SelectorTarget
  onChange: (value: string) => void
  onBlur: (target: SelectorTarget) => void
  onFocus: (target: SelectorTarget, selector: string) => void
}

export function SelectorInput({
  label,
  value,
  placeholder,
  multiline = false,
  selectorTarget,
  onChange,
  onBlur,
  onFocus,
}: SelectorInputProps) {
  const id = `${label}-${placeholder}`.replace(/\W+/g, "-")

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onBlur={() => onBlur(selectorTarget)}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocus(selectorTarget, value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onBlur={() => onBlur(selectorTarget)}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => onFocus(selectorTarget, value)}
        />
      )}
    </Field>
  )
}
