import { useEffect, useState } from 'react'

import { deleteFile, listFiles, uploadFile } from '../api/pages'
import { Button } from '../components/Button'
import type { UploadedFile } from '../types'

type Props = {
  maxUploadSizeMb: number
}

export function FilesPage({ maxUploadSizeMb }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      setFiles(await listFiles())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="section-page">
      <div className="section-header">
        <div>
          <h2>Files</h2>
          <p className="muted">Upload, download, and remove small files up to {maxUploadSizeMb} MB.</p>
        </div>
        <label className="upload-button">
          <input
            type="file"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0]
              if (!file) return
              try {
                await uploadFile(file)
                await refresh()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Upload failed')
              }
              event.target.value = ''
            }}
          />
          Upload file
        </label>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="files-grid">
        {files.map((file) => (
          <div className="file-card" key={file.id}>
            <strong>{file.original_name}</strong>
            <span className="muted">{file.mime_type}</span>
            <span className="muted">{(file.size / 1024).toFixed(1)} KB</span>
            <div className="file-actions">
              <a className="button button-secondary" href={`/api/files/${file.id}/download`}>
                Download
              </a>
              <Button variant="danger" onClick={async () => {
                await deleteFile(file.id)
                await refresh()
              }}>Delete</Button>
            </div>
          </div>
        ))}
        {files.length === 0 ? <div className="muted">No uploaded files yet.</div> : null}
      </div>
    </div>
  )
}
