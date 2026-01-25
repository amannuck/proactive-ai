import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Settings as SettingsIcon, Bell, Shield, Database, Users, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system preferences and integrations
          </p>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <p className="text-sm text-muted-foreground">Configure alert preferences</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Critical Surge Alerts</Label>
                <p className="text-sm text-muted-foreground">Immediate notifications for critical predictions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Low Inventory Warnings</Label>
                <p className="text-sm text-muted-foreground">Alert when supplies reach reorder point</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Staffing Gap Notifications</Label>
                <p className="text-sm text-muted-foreground">Notify when predicted demand exceeds scheduled staff</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Email Digest</Label>
                <p className="text-sm text-muted-foreground">Daily summary of predictions and actions</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Auto-Ordering */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Auto-Ordering</h3>
              <p className="text-sm text-muted-foreground">Configure automated purchase rules</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Enable Auto-Ordering</Label>
                <p className="text-sm text-muted-foreground">Automatically order from fixed contract suppliers</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Require Approval Above Threshold</Label>
                <p className="text-sm text-muted-foreground">Manual approval for orders over $5,000</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">User Management</h3>
                <p className="text-sm text-muted-foreground">Manage team access and permissions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Manage Users</Button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Authentication and access controls</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
