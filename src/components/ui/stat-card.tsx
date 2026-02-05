 import { Card, CardContent } from "@/components/ui/card";
 import { LucideIcon } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface StatCardProps {
   title: string;
   value: string | number;
   icon: LucideIcon;
   description?: string;
   trend?: {
     value: number;
     isPositive: boolean;
   };
   className?: string;
 }
 
 export function StatCard({
   title,
   value,
   icon: Icon,
   description,
   trend,
   className,
 }: StatCardProps) {
   return (
     <Card className={cn("animate-slide-in", className)}>
       <CardContent className="p-6">
         <div className="flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-sm font-medium text-muted-foreground">{title}</p>
             <p className="text-3xl font-bold tracking-tight">{value}</p>
             {description && (
               <p className="text-xs text-muted-foreground">{description}</p>
             )}
             {trend && (
               <p
                 className={cn(
                   "text-xs font-medium",
                   trend.isPositive ? "text-success" : "text-destructive"
                 )}
               >
                 {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}% oxirgi oyga nisbatan
               </p>
             )}
           </div>
           <div className="rounded-xl bg-primary/10 p-3">
             <Icon className="h-6 w-6 text-primary" />
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }