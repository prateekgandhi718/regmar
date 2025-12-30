"use client";

import { useState } from "react";
import { AccountsHeader } from "./_components/accounts-header";
import { AccountCard } from "./_components/account-card";
import { AddAccountDrawer } from "./_components/add-account-drawer";
import { useGetAccountsQuery, Account } from "@/redux/api/accountsApi";
import { Loader2 } from "lucide-react";
import { SetupPrompts } from "@/components/setup-prompts";

const AccountsPage = () => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const { data: accounts = [], isLoading } = useGetAccountsQuery();

  const filteredAccounts = accounts.filter((acc) =>
    acc.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedAccount(null);
    setIsOpen(true);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedAccount(null);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      <AccountsHeader 
        search={search} 
        setSearch={setSearch} 
        onAdd={handleAdd} 
      />
      
      <div className="flex-1 px-4 mt-6 space-y-6 overflow-y-auto">
        <SetupPrompts />
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAccounts.map((account) => (
              <div 
                key={account._id} 
                onClick={() => handleEdit(account)}
                className="cursor-pointer active:scale-[0.98] transition-transform"
              >
                <AccountCard
                  title={account.title}
                  accountNumber={account.accountNumber}
                  domainName={account.domainIds?.[0]?.fromEmail}
                  currency={account.currency}
                />
              </div>
            ))}

            {filteredAccounts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-sm font-medium">No accounts found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AddAccountDrawer 
        isOpen={isOpen} 
        onClose={handleClose} 
        initialData={selectedAccount}
      />
    </div>
  );
};

export default AccountsPage;
