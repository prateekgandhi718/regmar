"use client";

import { useGetAccountsQuery } from "@/redux/api/accountsApi";
import { useGetLinkedAccountsQuery } from "@/redux/api/linkedAccountsApi";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export const SetupPrompts = () => {
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery();
  const { data: linkedAccounts, isLoading: isLoadingLinked } = useGetLinkedAccountsQuery();

  const isEmailLinked = useMemo(() => 
    linkedAccounts && linkedAccounts.some(acc => acc.isActive && acc.provider === 'gmail'),
    [linkedAccounts]
  );

  const hasAccountWithDomain = useMemo(() => 
    accounts && accounts.some(acc => acc.domainIds && acc.domainIds.length > 0),
    [accounts]
  );

  const isLoading = isLoadingAccounts || isLoadingLinked;

  if (isLoading) return null;

  if (!isEmailLinked) {
    return (
      <div className="bg-orange-50 dark:bg-orange-500/5 border-2 border-orange-100 dark:border-orange-500/10 rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <AlertCircle className="h-32 w-32 text-orange-500" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Email Not Linked
          </h3>
          <p className="text-orange-700 dark:text-orange-300 text-sm font-medium max-w-[85%] leading-relaxed">
            To automatically fetch and display your transactions, please link your Gmail account in settings.
          </p>
        </div>
        
        <Button 
          asChild
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl h-12 px-8 font-black shadow-xl shadow-orange-500/20 active:scale-95 transition-all relative z-10"
        >
          <Link href="/settings" className="flex items-center gap-2">
            Link Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  if (!hasAccountWithDomain) {
    return (
      <div className="bg-blue-50 dark:bg-blue-500/5 border-2 border-blue-100 dark:border-blue-500/10 rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <AlertCircle className="h-32 w-32 text-blue-500" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Bank Account Required
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium max-w-[85%] leading-relaxed">
            You&apos;ve linked your email! Now add at least one bank account with transaction domains to start syncing.
          </p>
        </div>
        
        <Button 
          asChild
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-12 px-8 font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all relative z-10"
        >
          <Link href="/accounts" className="flex items-center gap-2">
            Go to Accounts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return null;
};

