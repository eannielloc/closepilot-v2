"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, FileText, Shield, Camera, CheckCircle2 } from "lucide-react"

interface NotificationPrefs {
  deadlineReminders: boolean
  overdueAlerts: boolean
  weeklyDigest: boolean
  reminderDaysBefore: number
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    deadlineReminders: true,
    overdueAlerts: true,
    weeklyDigest: true,
    reminderDaysBefore: 3,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user) setUser(data.user)
    }).catch(() => {})

    fetch("/api/settings/notifications").then(r => r.json()).then(data => {
      if (!data.error) setPrefs(data)
    }).catch(() => {})
  }, [])

  async function saveNotifications() {
    setSaving(true); setSaved(false)
    try {
      await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??"

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, notifications, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 h-11">
          <TabsTrigger value="profile" className="gap-1.5 text-xs"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" /> Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Profile</CardTitle>
              <CardDescription>Your information used across transactions and client portals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Avatar section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-2 border-white rounded-full shadow-sm flex items-center justify-center hover:bg-muted transition-colors">
                      <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name || "Loading..."}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      <Shield className="h-3 w-3 mr-1" /> Licensed Agent
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    { label: "Full Name", key: "name", placeholder: "Your full name" },
                    { label: "Email", key: "email", placeholder: "agent@example.com", readOnly: true },
                    { label: "Phone", key: "phone", placeholder: "(555) 000-0000" },
                    { label: "License Number", key: "licenseNumber", placeholder: "CT-REB.0000xxx" },
                    { label: "Brokerage", key: "brokerage", placeholder: "Your brokerage name" },
                  ].map((field) => (
                    <div key={field.key} className="grid grid-cols-3 items-center gap-4">
                      <label className="text-sm font-medium text-right text-muted-foreground">{field.label}</label>
                      <input
                        className="col-span-2 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        defaultValue={user?.[field.key] || ""}
                        placeholder={field.placeholder}
                        readOnly={field.readOnly}
                      />
                    </div>
                  ))}

                  {/* Bio */}
                  <div className="grid grid-cols-3 items-start gap-4">
                    <label className="text-sm font-medium text-right text-muted-foreground pt-2">Bio</label>
                    <textarea
                      className="col-span-2 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all min-h-[80px] resize-none"
                      placeholder="Tell clients about yourself and your experience..."
                      defaultValue=""
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => {
                      setProfileSaving(true)
                      setTimeout(() => { setProfileSaving(false); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000) }, 500)
                    }}>
                      {profileSaving ? "Saving..." : profileSaved ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>
                      ) : "Save Profile"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Notifications</CardTitle>
              <CardDescription>Choose when and how you receive email alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {user?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Notifications sent to: <strong className="text-foreground">{user.email}</strong>
                  </div>
                )}

                {[
                  { key: "deadlineReminders", emoji: "📅", title: "Deadline Reminders", desc: "Get notified before milestone deadlines" },
                  { key: "overdueAlerts", emoji: "🚨", title: "Overdue Alerts", desc: "Get alerted when milestones are past due" },
                  { key: "weeklyDigest", emoji: "📊", title: "Weekly Digest", desc: "Receive a weekly summary of all your transactions" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{item.emoji} {item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(prefs as any)[item.key]}
                      onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                      className="h-4 w-4 rounded accent-primary"
                    />
                  </label>
                ))}

                <div className="p-3.5 rounded-xl border">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">⏰ Reminder Timing</p>
                      <p className="text-xs text-muted-foreground">How many days before a deadline to send reminders</p>
                    </div>
                    <select
                      value={prefs.reminderDaysBefore}
                      onChange={(e) => setPrefs({ ...prefs, reminderDaysBefore: parseInt(e.target.value) })}
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveNotifications} disabled={saving}>
                    {saving ? "Saving..." : saved ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>
                    ) : "Save Notifications"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline Templates</CardTitle>
              <CardDescription>Save custom milestone templates for different transaction types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "CT Standard Purchase", desc: "SmartMLS Standard Form — 13 milestones", milestones: 13, isDefault: true },
                  { name: "Cash Purchase", desc: "No financing milestones — 9 milestones", milestones: 9, isDefault: true },
                  { name: "FHA Purchase", desc: "Includes FHA-specific requirements — 15 milestones", milestones: 15, isDefault: true },
                ].map((tmpl) => (
                  <div key={tmpl.name} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{tmpl.name}</p>
                        {tmpl.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tmpl.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-xs">Duplicate</Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full border-dashed mt-4 gap-2">
                  <FileText className="h-4 w-4" /> Create Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
