"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Transaction } from "@/redux/api/transactionsApi";
import { useGetCategoriesQuery } from "@/redux/api/categoriesApi";
import { useTagTransactionMutation } from "@/redux/api/transactionsApi";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QuickTagDrawerProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickTagDrawer = ({ transaction, isOpen, onClose }: QuickTagDrawerProps) => {
  const { data: categories, isLoading: isLoadingCategories } = useGetCategoriesQuery();
  const [tagTransaction, { isLoading: isTagging }] = useTagTransactionMutation();

  if (!transaction) return null;

  const handleSelectCategory = async (categoryId: string) => {
    try {
      await tagTransaction({ id: transaction._id, categoryId }).unwrap();
      toast.success("Transaction tagged successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to tag transaction");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] bg-background">
        <DrawerHeader className="relative flex items-center justify-center border-b border-border/50 pb-4">
          <DrawerClose asChild>
            <button className="absolute left-6 text-sm font-black text-rose-500 uppercase tracking-tight hover:opacity-80 transition-opacity">
              Cancel
            </button>
          </DrawerClose>
          <DrawerTitle className="text-lg font-black uppercase tracking-tight">Quick Tag</DrawerTitle>
        </DrawerHeader>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* Transaction Summary Card */}
          <div className="bg-card border-2 border-secondary/50 rounded-4xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-2 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground uppercase tracking-tight truncate leading-tight">
                  {transaction.description}
                </p>
                <p className="text-xs font-black text-foreground/80 uppercase tracking-tight mt-1">
                  PRATEEK GANDHI
                </p>
              </div>
              <span className={`text-lg font-black whitespace-nowrap ${transaction.type === 'debit' ? 'text-primary' : 'text-emerald-500'}`}>
                ₹{transaction.originalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-2">
              {format(new Date(transaction.date), "dd MMM 'yy")} • {transaction.accountId?.title}
            </p>
          </div>

          {/* Categories Section */}
          <div className="space-y-6">
            <h3 className="text-base font-black uppercase tracking-widest text-foreground">Category</h3>
            
            {isLoadingCategories ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-4">
                {categories?.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleSelectCategory(category._id)}
                    disabled={isTagging}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all active:scale-95 disabled:opacity-50",
                      "hover:bg-secondary/50"
                    )}
                    style={{ 
                      borderColor: category.color || 'var(--border)',
                      color: category.color || 'var(--foreground)'
                    }}
                  >
                    <span className="text-lg leading-none">{category.emoji}</span>
                    <span className="text-xs font-black uppercase tracking-tight">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

