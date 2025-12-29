"use client";

import { useState } from "react";
import { ChevronRight, Mail, Lock, ExternalLink, ArrowLeft, Loader2, MailQuestion, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useGetLinkedAccountsQuery, useLinkGmailAccountMutation, useUnlinkAccountMutation } from "@/redux/api/linkedAccountsApi";

const providers = [
  { id: "gmail", name: "Gmail", icon: Mail, color: "text-rose-500", enabled: true },
  { id: "yahoo", name: "Yahoo", icon: Mail, color: "text-purple-600", enabled: false },
  { id: "icloud", name: "iCloud", icon: Mail, color: "text-blue-400", enabled: false },
  { id: "custom", name: "Custom", icon: Mail, color: "text-orange-500", enabled: false },
];

const SettingsPage = () => {
  const [step, setStep] = useState<"selection" | "gmail-form">("selection");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  
  const { data: linkedAccounts, isLoading: isLoadingAccounts } = useGetLinkedAccountsQuery();
  const [linkGmail, { isLoading: isLinking }] = useLinkGmailAccountMutation();
  const [unlinkAccount, { isLoading: isUnlinking }] = useUnlinkAccountMutation();

  const activeGmail = linkedAccounts?.find(acc => acc.provider === "gmail" && acc.isActive);

  const handleLink = async () => {
    if (!email || !appPassword) return;
    try {
      await linkGmail({ email, appPassword }).unwrap();
      setStep("selection");
      setEmail("");
      setAppPassword("");
    } catch (error) {
      console.error("Failed to link Gmail:", error);
    }
  };

  const handleUnlink = async (id: string) => {
    if (!confirm("Are you sure you want to unlink this account?")) return;
    try {
      await unlinkAccount(id).unwrap();
    } catch (error) {
      console.error("Failed to unlink:", error);
    }
  };

  if (step === "selection") {
    return (
      <div className="max-w-md mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Link Email Account</h1>
          <div className="flex justify-center">
            <div className="bg-orange-100 p-6 rounded-3xl">
              <Mail className="h-12 w-12 text-orange-500" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium px-4">
            Link your email account to automatically fetch statements and transactions
          </p>
        </div>

        <div className="space-y-3">
          {activeGmail ? (
             <Card className="p-4 border-2 border-orange-200 bg-orange-50/30 flex items-center justify-between group">
               <div className="flex items-center gap-4">
                 <div className="bg-white p-2 rounded-xl shadow-sm">
                   <Mail className="h-6 w-6 text-rose-500" />
                 </div>
                 <div>
                   <p className="font-bold">Gmail</p>
                   <p className="text-xs text-muted-foreground">{activeGmail.email}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="text-muted-foreground hover:text-destructive"
                   onClick={() => handleUnlink(activeGmail.id)}
                   disabled={isUnlinking}
                 >
                   {isUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon"
                   onClick={() => setStep("gmail-form")}
                 >
                   <ChevronRight className="h-5 w-5" />
                 </Button>
               </div>
             </Card>
          ) : (
            providers.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full h-16 justify-between px-4 rounded-2xl border-border bg-card hover:bg-secondary/50 transition-all disabled:opacity-50"
                disabled={!provider.enabled}
                onClick={() => provider.id === "gmail" && setStep("gmail-form")}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-secondary p-2 rounded-xl">
                    <provider.icon className={`h-6 w-6 ${provider.color}`} />
                  </div>
                  <span className="font-bold text-foreground">{provider.name}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            ))
          )}
        </div>

        <div className="pt-4">
           <Button variant="ghost" className="w-full h-14 rounded-2xl font-bold text-muted-foreground">
             Cancel
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setStep("selection")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Link Email Account</h1>
        <div className="w-9" />
      </div>

      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-border">
            <Mail className="h-12 w-12 text-rose-500" />
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gmail</p>
      </div>

      <div className="space-y-4">
        <div className="bg-secondary/50 rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center px-4 h-14 border-b border-border/50">
            <Mail className="h-5 w-5 text-muted-foreground mr-3" />
            <Label className="w-16 text-sm font-semibold text-foreground/70">Email</Label>
            <Input 
              placeholder="enter email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-medium"
            />
          </div>
          <div className="flex items-center px-4 h-14">
            <Lock className="h-5 w-5 text-muted-foreground mr-3" />
            <Label className="w-20 text-sm font-semibold text-foreground/70">Password</Label>
            <Input 
              type="password"
              placeholder="enter app password" 
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-medium"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center px-4">
          An app-specific password is required to fetch emails from your Gmail account.
        </p>
      </div>

      <div className="bg-secondary/30 rounded-2xl p-6 space-y-6 border border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-orange-500 font-bold hover:bg-orange-50"
          asChild
        >
          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer">
            Generate App Password
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>

        <div className="space-y-4 text-sm">
          <p><span className="font-bold">Step 1:</span> Tap the above button and sign-in to your Gmail account.</p>
          <p><span className="font-bold">Step 2:</span> In the <span className="italic">App passwords</span> screen, name it <span className="font-bold">Regmar</span> and tap Create.</p>
          <p><span className="font-bold">Step 3:</span> Copy the app-specific password and paste it in the password field above.</p>
        </div>
      </div>

      <div className="pt-4 flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1 h-14 rounded-2xl font-bold bg-secondary border-none"
          onClick={() => setStep("selection")}
        >
          Back
        </Button>
        <Button 
          className="flex-1 h-14 rounded-2xl font-bold bg-linear-to-r from-orange-500 to-rose-500 text-white"
          onClick={handleLink}
          disabled={isLinking || !email || !appPassword}
        >
          {isLinking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Link Account"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
