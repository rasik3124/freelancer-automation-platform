import React from "react";
import { User, Bell, Shield, CreditCard, Globe, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";


export const Settings: React.FC = () => {
  const { user } = useAuth();


  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-textPrimary">Settings</h2>
        <p className="text-textMuted">Manage your account preferences and business profile.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { icon: User, label: "Profile", active: true },
              { icon: Bell, label: "Notifications", active: false },
              { icon: Shield, label: "Security", active: false },
              { icon: CreditCard, label: "Billing", active: false },
              { icon: Globe, label: "Integrations", active: false },
            ].map((item) => (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  item.active ? "bg-accent/10 text-accent" : "text-textMuted hover:bg-surface hover:text-textPrimary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-card border border-border bg-surface/50 p-8">
            <h3 className="text-lg font-bold text-textPrimary mb-6">Public Profile</h3>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-base">
                    <User className="h-full w-full p-6 text-textDisabled" />
                  </div>
                  <button className="absolute bottom-0 right-0 rounded-full bg-accent p-2 text-base shadow-glow">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-textPrimary">Profile Picture</h4>
                  <p className="text-xs text-textMuted">PNG, JPG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input label="Full Name" defaultValue={user?.fullName} />
                <Input label="Email Address" defaultValue={user?.email} icon={<Mail className="h-4 w-4" />} />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-textMuted">Role</label>
                  <select className="w-full rounded-input bg-base border border-border px-4 py-2.5 text-sm text-textPrimary focus:outline-none focus:border-accent">
                    <option>{user?.role}</option>
                    <option>UI/UX Designer</option>
                    <option>Fullstack Developer</option>
                  </select>
                </div>
                <Input label="Portfolio URL" placeholder="https://..." icon={<Globe className="h-4 w-4" />} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-textMuted">Bio</label>
                <textarea
                  className="h-32 w-full rounded-input bg-base border border-border p-4 text-sm text-textPrimary focus:outline-none focus:border-accent"
                  placeholder="Tell clients about your expertise..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Plus = (props: any) => <User {...props} />;
