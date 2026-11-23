import { RiFileExcel2Line } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { useToast } from '@/components/shared/toast.jsx'

export function ExportButton({ build, label = 'Export to Excel' }) {
  const notify = useToast()
  const [pending, setPending] = useState(false)

  async function run() {
    setPending(true)
    try {
      const [{ default: writeExcelFile }, file] = await Promise.all([
        import('write-excel-file/browser'),
        build()
      ])
      await writeExcelFile(file.sheets).toFile(file.fileName)
      notify(
        file.complete === false
          ? `Exported the first ${file.rows} rows. Narrow the filters to get the rest.`
          : `Exported ${file.rows} ${file.rows === 1 ? 'row' : 'rows'}`
      )
    } catch (error) {
      notify(error.message, { status: 'error' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="secondary"
      size="small"
      leadingIcon={RiFileExcel2Line}
      onClick={run}
      disabled={pending}
    >
      {pending ? 'Exporting…' : label}
    </Button>
  )
}
