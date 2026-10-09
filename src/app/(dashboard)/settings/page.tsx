"use client";

import React from "react";
import { useUserStore } from "@/lib/stores/useUserStore";
import { isAdmin } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, User, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  const { currentUser } = useUserStore();

  if (!isAdmin(currentUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-zinc-500">You do not have administrative permissions to access the settings page.</p>
        <Button variant="outline">Return to Boards</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">System Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Configure global application preferences and user permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
            <User className="w-5 h-5 text-blue-600" />
            User Management
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default User Role</Label>
              <select className="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm">
                <option value="member">Team Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <Button className="w-full">Review All Users</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
            <Globe className="w-5 h-5 text-green-600" />
            General Config
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Application Name</Label>
              <Input defaultValue="Trello Clone" />
            </div>
            <div className="space-y-2">
              <Label>API Endpoint</Label>
              <Input defaultValue="http://localhost:3001" />
            </div>
            <Button variant="outline" className="w-full">Save Configuration</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Notifications
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Email Notifications</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Desktop Push</span>
              <input type="checkbox" className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Realtime Alerts</span>
              <input type="checkbox" className="w-4 h-4" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
