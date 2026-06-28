import { FolderOpen, FolderX, HardDrive } from 'lucide-react'

interface Props {
  folderName: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export function FolderStatus({ folderName, onConnect, onDisconnect }: Props) {
  if (folderName) {
    return (
      <div className="flex items-center gap-1.5 group">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-go/30 bg-go/5 text-xs">
          <HardDrive size={12} className="text-go shrink-0" />
          <span className="text-go font-medium max-w-28 truncate" title={folderName}>{folderName}</span>
        </div>
        <button
          onClick={onDisconnect}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded theme-muted hover:text-stop"
          title="Disconnect folder"
        >
          <FolderX size={13} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onConnect}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-accent/50 hover:text-accent transition-colors text-xs theme-muted"
      title="Connect a local folder to persist sessions as files"
    >
      <FolderOpen size={13} />
      <span>Connect Folder</span>
    </button>
  )
}
