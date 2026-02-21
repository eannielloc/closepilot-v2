"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Send, Clock } from "lucide-react"

interface Note {
  id: string
  text: string
  createdAt: string
  author?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotesSection({ transactionId }: { transactionId: string }) {
  const [notes, setNotes] = useState<Note[]>([
    { id: "n1", text: "Buyer's attorney requested 3-day extension on review period. Seller's attorney agreed verbally — waiting on written confirmation.", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), author: "Chris" },
    { id: "n2", text: "Inspection scheduled for Tuesday 10am. Inspector: Bob's Home Inspections (203) 555-0199", createdAt: new Date(Date.now() - 86400000).toISOString(), author: "Chris" },
    { id: "n3", text: "Lender confirmed pre-approval is good for 90 days from application date.", createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), author: "Chris" },
  ])
  const [newNote, setNewNote] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const addNote = () => {
    if (!newNote.trim()) return
    const note: Note = {
      id: `n_${Date.now()}`,
      text: newNote.trim(),
      createdAt: new Date().toISOString(),
      author: "Chris",
    }
    setNotes((prev) => [note, ...prev])
    setNewNote("")
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      {/* Add note */}
      {isAdding ? (
        <div className="border rounded-xl p-3 space-y-3 bg-white">
          <textarea
            autoFocus
            className="w-full text-sm border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 min-h-[80px]"
            placeholder="Add a note about this transaction..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) addNote() }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">⌘+Enter to save</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setNewNote("") }}>
                Cancel
              </Button>
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="gap-1">
                <Send className="h-3 w-3" /> Save Note
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground border-dashed h-11"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" /> Add a note...
        </Button>
      )}

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow">
              <p className="text-sm leading-relaxed">{note.text}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">{(note.author || "C")[0]}</span>
                </div>
                <span className="font-medium">{note.author || "Agent"}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(note.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          No notes yet. Add one to track conversations and details.
        </div>
      )}
    </div>
  )
}
