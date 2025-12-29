"use client";

import { useSyncTransactionsMutation } from "@/redux/api/syncApi";
import { useGetAccountsQuery } from "@/redux/api/accountsApi";
import { useGetLinkedAccountsQuery } from "@/redux/api/linkedAccountsApi";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const HomePage = () => {
  const [sync, { isLoading: isSyncing }] = useSyncTransactionsMutation();
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery();
  const { data: linkedAccounts, isLoading: isLoadingLinked } = useGetLinkedAccountsQuery();
  
  const [result, setResult] = useState<{ count: number; success: boolean } | null>(null);

  const isEmailLinked = useMemo(() => 
    linkedAccounts && linkedAccounts.some(acc => acc.isActive && acc.provider === 'gmail'),
    [linkedAccounts]
  );

  const hasAccountWithDomain = useMemo(() => 
    accounts && accounts.some(acc => acc.domainIds && acc.domainIds.length > 0),
    [accounts]
  );

  const handleSync = async () => {
    if (!isEmailLinked || !hasAccountWithDomain) return;
    
    try {
      const data = await sync().unwrap();
      setResult({ count: data.transactionsSynced, success: true });
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error("Sync failed:", error);
      setResult({ count: 0, success: false });
      setTimeout(() => setResult(null), 5000);
    }
  };

  const isLoading = isLoadingAccounts || isLoadingLinked;

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Regmar</h1>
        <p className="text-muted-foreground font-medium">Simplify your finances, automatically.</p>
      </div>

      <Card className="p-8 border-2 border-secondary bg-card rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors" />
        
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Automatic Sync</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">
              Fetch new transactions from your linked Gmail domains. We use secure regex parsing to extract your data.
            </p>
          </div>

          {!isLoading && !isEmailLinked && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-orange-800">Email Linking Required</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  You must link your Gmail account in settings before you can sync transactions.
                </p>
                <Button variant="link" className="p-0 h-auto text-xs text-orange-800 font-bold underline gap-1" asChild>
                  <Link href="/settings">Go to Settings <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          )}

          {!isLoading && isEmailLinked && !hasAccountWithDomain && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-blue-800">Bank Account Required</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  You&apos;ve linked your email! Now add at least one bank account with transaction domains to start syncing.
                </p>
                <Button variant="link" className="p-0 h-auto text-xs text-blue-800 font-bold underline gap-1" asChild>
                  <Link href="/accounts">Go to Accounts <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSync}
              disabled={isSyncing || !isEmailLinked || !hasAccountWithDomain || isLoading}
              className="h-14 px-8 rounded-2xl bg-linear-to-r from-orange-500 to-rose-500 text-white font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Sync Transactions
                </>
              )}
            </Button>
          </div>

          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 ${
              result.success ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}>
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-bold">{result.count} new transactions synced!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-bold">Sync failed. Please check your settings.</span>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-secondary/30 rounded-4xl border border-border/50">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
          <p className="text-lg font-bold">{isLoading ? "Checking..." : isEmailLinked ? "Linked" : "Not Linked"}</p>
        </div>
        <div className="p-6 bg-secondary/30 rounded-4xl border border-border/50">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Accounts</p>
          <p className="text-lg font-bold">{isLoading ? "..." : accounts?.length || 0} active</p>
        </div>
      </div>
    </div>
  )
}

export default HomePage;
