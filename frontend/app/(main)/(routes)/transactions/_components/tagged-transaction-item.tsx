"use client";

import { Transaction } from "@/redux/api/transactionsApi";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TransactionItemProps {
  transaction: Transaction;
  onTagClick?: (transaction: Transaction) => void;
}

export const TransactionItem = ({ transaction, onTagClick }: TransactionItemProps) => {
  const isDebit = transaction.type === "debit";
  const isTagged = !!transaction.categoryId;
  
  return (
    <div className="bg-card border-2 border-secondary/50 rounded-4xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {isTagged && (
            <div className="h-11 w-11 rounded-2xl bg-secondary/50 flex items-center justify-center text-xl shrink-0 border border-border/50">
              {transaction.categoryId?.emoji || "💰"}
            </div>
          )}
          <div className="space-y-0.5 min-w-0">
            <p className="text-sm font-black text-muted-foreground truncate uppercase tracking-tight leading-tight">
              {transaction.description}
            </p>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              {transaction.accountId?.title}
            </p>
          </div>
        </div>
        <span className={`text-lg font-black whitespace-nowrap ${isDebit ? 'text-primary' : 'text-emerald-500'}`}>
          ₹{transaction.originalAmount.toLocaleString('en-IN')}
        </span>
      </div>
      
      {!isTagged && (
        <Button 
          variant="secondary" 
          onClick={() => onTagClick?.(transaction)}
          className="h-9 px-4 rounded-xl bg-primary/80 text-primary-foreground font-black text-[10px] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-1.5 border-none"
        >
          <div className="bg-white rounded-full">
            <Plus className="h-2.5 w-2.5 text-primary stroke-[4px]" />
          </div>
          TAG
        </Button>
      )}
    </div>
  );
};
