"use client";

import { useState, useEffect } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { 
  useAddAccountMutation, 
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  Account 
} from "@/redux/api/accountsApi";

interface AddAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Account | null;
}

export const AddAccountDrawer = ({ isOpen, onClose, initialData }: AddAccountDrawerProps) => {
  const [title, setTitle] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [accountNumber, setAccountNumber] = useState("");
  const [domains, setDomains] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addAccount] = useAddAccountMutation();
  const [updateAccount] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCurrency(initialData.currency);
      setAccountNumber(initialData.accountNumber || "");
      setDomains(initialData.domainIds?.map(d => d.fromEmail) || [""]);
    } else {
      setTitle("");
      setCurrency("INR");
      setAccountNumber("");
      setDomains([""]);
    }
  }, [initialData, isOpen]);

  const handleAddDomain = () => {
    setDomains([...domains, ""]);
  };

  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index));
  };

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm("Are you sure you want to delete this account?")) return;

    setIsSubmitting(true);
    try {
      await deleteAccount(initialData._id).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        currency,
        accountNumber,
        domainNames: domains.filter(d => d.trim() !== ""),
      };

      if (initialData) {
        await updateAccount({ id: initialData._id, ...payload }).unwrap();
      } else {
        await addAccount(payload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-background border-t max-h-[90vh]">
        <DrawerHeader className="px-6 pt-6 border-b">
          <div className="flex items-center justify-between w-full">
            <button onClick={onClose} className="text-sm font-medium text-muted-foreground">Cancel</button>
            <DrawerTitle className="text-xl font-bold tracking-tight">
              {initialData ? title : "New Account"}
            </DrawerTitle>
            {initialData ? (
              <button 
                onClick={handleDelete}
                className="text-destructive hover:opacity-75 transition-opacity"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            ) : (
              <div className="w-5" />
            )}
          </div>
        </DrawerHeader>

        <div className="px-6 py-8 space-y-10 overflow-y-auto">
          {/* Step 1: Account Info */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Step 1</span>
            </div>
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Account Info</h3>
            
            <div className="bg-secondary/50 rounded-2xl overflow-hidden border border-border">
              <div className="flex items-center px-4 h-14 border-b border-border/50">
                <Label htmlFor="title" className="w-24 text-sm font-semibold text-foreground/70">Title</Label>
                <Input 
                  id="title"
                  placeholder="HDFC" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-none focus-visible:ring-0 text-right bg-transparent h-full font-medium"
                />
              </div>
              <div className="flex items-center px-4 h-14 border-b border-border/50">
                <Label htmlFor="currency" className="w-24 text-sm font-semibold text-foreground/70">Currency</Label>
                <Input 
                  id="currency"
                  placeholder="INR" 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border-none focus-visible:ring-0 text-right bg-transparent h-full font-medium"
                />
              </div>
              <div className="flex items-center px-4 h-14">
                <Label htmlFor="number" className="w-24 text-sm font-semibold text-foreground/70">Number</Label>
                <Input 
                  id="number"
                  placeholder="8850" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="border-none focus-visible:ring-0 text-right bg-transparent h-full font-medium"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Domains */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Step 2</span>
            </div>
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Domains</h3>
            
            <div className="bg-secondary/50 rounded-2xl border border-border divide-y divide-border/50">
              {domains.map((domain, index) => (
                <div key={index} className="flex items-center px-4 h-14 group">
                  <Label className="w-24 text-sm font-semibold text-foreground/70">Domain {index + 1}</Label>
                  <Input 
                    placeholder="e.g. alerts@hdfc.com" 
                    value={domain}
                    onChange={(e) => handleDomainChange(index, e.target.value)}
                    className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-medium"
                  />
                  {domains.length > 1 && (
                    <button 
                      onClick={() => handleRemoveDomain(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button 
                onClick={handleAddDomain}
                className="w-full h-14 flex items-center justify-center gap-2 text-sm font-bold text-orange-500 hover:bg-secondary/80 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add Domain
              </button>
            </div>
          </section>
        </div>

        <DrawerFooter className="px-6 pb-10 pt-4 bg-background border-t flex flex-row gap-4">
          <Button 
            variant="outline" 
            className="flex-1 h-14 rounded-2xl font-black bg-secondary border-none text-foreground hover:bg-secondary/80"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 h-14 rounded-2xl font-black bg-linear-to-r from-orange-500 to-rose-500 text-white border-none shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting || !title}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
