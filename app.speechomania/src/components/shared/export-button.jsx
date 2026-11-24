import { RiFileExcel2Line } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { useToast } from '@/components/shared/toast.jsx'
import { download } from '@/services/api.js'

export function ExportButton({
  path,
  query,
  label = 'Export to Excel',
  icon = RiFileExcel2Line,
  size = 'small',
  iconOnly = false
}) {
  const notify = useToast()
  const [pending, setPending] = useState(false)

  async function run() {
    setPending(true)
    try {
      notify(`Downloaded ${await download(path, { query })}`)
    } catch (error) {
      notify(error.message, { status: 'error' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size={size}
      leadingIcon={icon}
      iconOnly={iconOnly}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
      onClick={run}
      disabled={pending}
    >
      {pending ? 'Preparing…' : label}
    </Button>
  )
}
