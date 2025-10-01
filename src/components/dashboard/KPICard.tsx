import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "destructive" | "primary";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, icon: Icon, variant = "default", trend }: KPICardProps) {
  const variantClasses = {
    default: "border-border",
    success: "border-success/20 bg-success/5",
    destructive: "border-destructive/20 bg-destructive/5",
    primary: "border-primary/20 bg-primary/5",
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", variantClasses[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          variant === "success" && "text-success",
          variant === "destructive" && "text-destructive",
          variant === "primary" && "text-primary",
          variant === "default" && "text-muted-foreground"
        )} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "+" : ""}{trend.value} vs mês anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
