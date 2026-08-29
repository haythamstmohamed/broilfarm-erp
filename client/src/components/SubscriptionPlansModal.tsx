import React from "react";
import { SUBSCRIPTION_PLANS, SubscriptionPlanTier } from "@/../../shared/subscriptionPlans";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Building, Zap } from "lucide-react";
import { toast } from "sonner";

export function SubscriptionPlansModal({
  currentPlan = "pro",
  open,
  onOpenChange,
}: {
  currentPlan?: SubscriptionPlanTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const handleSelectPlan = (planId: SubscriptionPlanTier) => {
    if (planId === currentPlan) {
      toast.info("أنت مشترك بالفعل في هذه الباقة");
      return;
    }
    toast.success(`تم اختيار ${SUBSCRIPTION_PLANS[planId].name}. سيتم توجيهك لبوابة الدفع.`);
    onOpenChange(false);
  };

  const featureLabels: Record<string, string> = {
    advanced_reports: "تقارير تدقيق فني ومالي + تصدير Excel CSV",
    smart_alerts: "محرك التنبيهات الذكية واستشعار الانحرافات",
    medicine_inventory: "مخزن الأدوية واللقاحات وتتبع الصلاحية والتشغيلات",
    profitability_simulator: "محاكي سيناريوهات الربحية وتحديد يوم البيع الأمثل",
    smart_scale_bridge: "تكامل الموازين الإلكترونية الذكية (Bluetooth / Serial)",
    unlimited_exports: "تصدير وطباعة غير محدودة لكافة السجلات",
    executive_dashboard: "لوحة القيادة التنفيذية للمؤسسة والمقارنة المعيارية للمزارع",
    iot_sensors: "مراقبة مستشعرات العنابر الحية (حرارة، رطوبة، أمونيا، CO2)",
    audit_logs: "سجل التدقيق والرقابة وتتبع العمليات الحساسة (Audit Trail)",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-y-auto max-h-[90vh]" dir="rtl">
        <DialogHeader className="text-center pb-4 border-b">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown className="w-6 h-6 text-amber-500" />
            <DialogTitle className="text-2xl font-bold">باقات الاشتراك التجاري — BroilFarm ERP</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            اختر الباقة المناسبة لحجم أعمالك ومزارعك للاستفادة من أحدث تقنيات إدارة مزارع التسمين.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 py-4">
          {(Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanTier[]).map((key) => {
            const plan = SUBSCRIPTION_PLANS[key];
            const isCurrent = key === currentPlan;
            const isPopular = key === "pro";

            return (
              <Card
                key={key}
                className={`relative flex flex-col justify-between transition-all ${
                  isPopular
                    ? "border-primary shadow-lg ring-2 ring-primary/20 bg-gradient-to-b from-primary/5 to-transparent"
                    : isCurrent
                    ? "border-emerald-500 bg-emerald-50/20"
                    : "border-border"
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 right-1/2 translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2">
                    الأكثر طلباً
                  </Badge>
                )}

                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-base font-bold">{plan.name.split(" ")[0]}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold text-foreground">
                      {plan.priceMonthlyEgp.toLocaleString("ar-EG")}
                    </span>
                    <span className="text-xs text-muted-foreground mr-1">ج.م / شهر</span>
                  </div>
                  <CardDescription className="text-xs mt-1 min-h-[32px]">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs flex-1">
                  <div className="p-2 rounded-lg bg-muted/50 space-y-1 font-medium">
                    <p>• {plan.limits.maxFarms === 9999 ? "مزارع غير محدودة" : `حتى ${plan.limits.maxFarms} مزارع`}</p>
                    <p>• {plan.limits.maxHousesPerFarm === 9999 ? "عنابر غير محدودة" : `${plan.limits.maxHousesPerFarm} عنابر / مزرعة`}</p>
                    <p>• {plan.limits.maxUsersPerFarm === 9999 ? "مستخدمين غير محدودين" : `حتى ${plan.limits.maxUsersPerFarm} مستخدم`}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-1.5 text-[11px] leading-tight">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-foreground">{featureLabels[feat] || feat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="pt-3">
                  <Button
                    size="sm"
                    variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                    className="w-full text-xs font-bold"
                    onClick={() => handleSelectPlan(key)}
                  >
                    {isCurrent ? "باقتك الحالية" : "اختيار الباقة"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionPlansModal;
