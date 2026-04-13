import { Input } from "@/components/ui/input"
import { t } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { useCallback, useEffect, useRef, useState } from "react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setLocal(value) }, [value])

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [])

  const debounced = useCallback(
    (v: string) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => onChange(v), 300)
    },
    [onChange],
  )

  return (
    <div className="relative">
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        ref={inputRef}
        type="text"
        value={local}
        onChange={(e) => { setLocal(e.target.value); debounced(e.target.value) }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { if (timer.current) clearTimeout(timer.current); onChange(local) }
          if (e.key === "Escape") { setLocal(""); onChange(""); inputRef.current?.blur() }
        }}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        className="ps-9 pe-9"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); inputRef.current?.focus() }}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("filter.clearSearch")}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
        </button>
      )}
    </div>
  )
}
