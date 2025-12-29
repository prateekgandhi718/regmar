import { MoreVertical } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  title: string;
  accountNumber?: string;
  icon?: string;
  className?: string;
}

export const AccountCard = ({
  title,
  accountNumber,
  icon,
  className,
}: AccountCardProps) => {
  return (
    <Card
      className={cn(
        "relative w-64 aspect-video rounded-2xl p-4 text-white overflow-hidden border-none shadow-lg shrink-0",
        "bg-linear-to-br from-rose-500 via-rose-600 to-rose-800",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-0.5">
          <h3 className="font-bold text-lg tracking-wider uppercase leading-none">{title}</h3>
          <p className="text-[10px] opacity-70 uppercase font-semibold">Bank</p>
        </div>
        <button className="p-1 hover:bg-white/10 rounded-full transition-colors -mr-1 -mt-1">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="space-y-0.5">
          {accountNumber && (
            <p className="text-[10px] font-black opacity-80 mb-1 tracking-wider">
              •••• {accountNumber.slice(-4)}
            </p>
          )}
        </div>
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
           {icon ? (
             <Image 
               src={icon} 
               alt={title} 
               width={16}
               height={16}
               className="h-4 w-4 object-contain" 
             />
           ) : (
             <div className="h-4 w-4 flex items-center justify-center text-[8px] font-black text-white">
               {title.substring(0, 2).toUpperCase()}
             </div>
           )}
        </div>
      </div>
    </Card>
  );
};

