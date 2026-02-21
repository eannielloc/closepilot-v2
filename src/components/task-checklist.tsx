"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  label: string
  completed: boolean
  category: string
}

const DEFAULT_TASKS: Task[] = [
  { id: "t1", label: "Attorney review scheduled", completed: false, category: "Legal" },
  { id: "t2", label: "Home inspection scheduled", completed: false, category: "Inspection" },
  { id: "t3", label: "Radon test ordered", completed: false, category: "Inspection" },
  { id: "t4", label: "Appraisal ordered", completed: false, category: "Financing" },
  { id: "t5", label: "Mortgage application submitted", completed: false, category: "Financing" },
  { id: "t6", label: "Title search ordered", completed: false, category: "Title" },
  { id: "t7", label: "Homeowners insurance binder obtained", completed: false, category: "Insurance" },
  { id: "t8", label: "Final walkthrough scheduled", completed: false, category: "Closing" },
  { id: "t9", label: "Closing attorney confirmed", completed: false, category: "Closing" },
  { id: "t10", label: "Utility transfer arranged", completed: false, category: "Closing" },
]

export function TaskChecklist({ transactionId }: { transactionId: string }) {
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS)
  const [newTask, setNewTask] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks((prev) => [
      ...prev,
      { id: `t_${Date.now()}`, label: newTask.trim(), completed: false, category: "Custom" },
    ])
    setNewTask("")
    setIsAdding(false)
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progress = Math.round((completedCount / tasks.length) * 100)

  // Group by category
  const categories = Array.from(new Set(tasks.map((t) => t.category)))

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{tasks.length}
        </span>
      </div>

      {/* Tasks by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat}</h4>
          <div className="space-y-1">
            {tasks
              .filter((t) => t.category === cat)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.label}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}

      {/* Add task */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Add a custom task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setIsAdding(false) }}
          />
          <Button size="sm" onClick={addTask}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground text-sm"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4" /> Add custom task
        </Button>
      )}
    </div>
  )
}
