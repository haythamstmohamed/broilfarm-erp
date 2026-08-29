import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, AlertTriangle, CheckCircle2, Droplets, Gauge, Plus, RefreshCw, Thermometer, Wind, Zap } from "lucide-react";
import { toast } from "sonner";

export function EnvironmentalSensorsPanel({
  farmId,
  houseId,
  houseName = "عنبر 1",
}: {
  farmId: number;
  houseId: number;
  houseName?: string;
}) {
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [temp, setTemp] = useState("24.5");
  const [humidity, setHumidity] = useState("62.0");
  const [nh3, setNh3] = useState("12.0");
  const [co2, setCo2] = useState("1800");
  const [pressure, setPressure] = useState("25.0");

  const { data: readings, isLoading, refetch } = trpc.sensors.getLatest.useQuery(
    { farmId, houseId },
    { enabled: !!farmId && !!houseId, refetchInterval: 15000 }
  );

  const ingestMutation = trpc.sensors.ingest.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل قراءات المستشعرات وتحديث بيئة العنبر بنجاح");
      setIsSimulateOpen(false);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء التسجيل");
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    ingestMutation.mutate({
      farmId,
      houseId,
      readings: [
        { sensorType: "temperature", value: Number(temp) || 24, unit: "°C" },
        { sensorType: "humidity", value: Number(humidity) || 60, unit: "%" },
        { sensorType: "ammonia_nh3", value: Number(nh3) || 10, unit: "ppm" },
        { sensorType: "co2", value: Number(co2) || 1500, unit: "ppm" },
        { sensorType: "static_pressure", value: Number(pressure) || 20, unit: "Pa" },
      ],
    });
  };

  if (!farmId || !houseId) return null;

  const tempReading = readings?.find((r) => r.sensorType === "temperature");
  const humidityReading = readings?.find((r) => r.sensorType === "humidity");
  const nh3Reading = readings?.find((r) => r.sensorType === "ammonia_nh3");
  const co2Reading = readings?.find((r) => r.sensorType === "co2");
  const pressureReading = readings?.find((r) => r.sensorType === "static_pressure");

  return (
    <Card className="mt-6" dir="rtl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              مستشعرات البيئة والتهوية المباشرة — {houseName}
            </CardTitle>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              IoT Live Stream
            </Badge>
          </div>
          <CardDescription>
            متابعة مناخ العنبر (حرارة، رطوبة، غازات الأمونيا، CO2، وضغط الهواء) لحظياً لحماية القطيع من الإجهاد.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </Button>
          <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                تسجيل قراءة بيئية
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>تسجيل قراءات مستشعرات العنبر يدويًا أو عبر IoT</DialogTitle>
                <DialogDescription>
                  أدخل أحدث قياسات أجهزة العنبر لتقييم ملاءمة المناخ للقطيع.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSimulate} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">درجة الحرارة (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الرطوبة النسبية (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={humidity}
                      onChange={(e) => setHumidity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">غاز الأمونيا NH3 (ppm)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={nh3}
                      onChange={(e) => setNh3(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ثاني أكسيد الكربون CO2 (ppm)</Label>
                    <Input
                      type="number"
                      value={co2}
                      onChange={(e) => setCo2(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">الضغط الاستاتيكي (Pascal)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={pressure}
                    onChange={(e) => setPressure(e.target.value)}
                    required
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSimulateOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={ingestMutation.isPending}>
                    {ingestMutation.isPending ? "جاري الإرسال..." : "حفظ القراءات"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">جاري تحميل القياسات...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Temperature Gauge */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">درجة الحرارة</span>
                <Thermometer className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {tempReading ? `${tempReading.numericValue}°C` : "24.0°C"}
              </p>
              <Badge
                variant={
                  tempReading?.assessment.status === "critical"
                    ? "destructive"
                    : tempReading?.assessment.status === "warning"
                    ? "secondary"
                    : "outline"
                }
                className="text-[10px]"
              >
                {tempReading?.assessment.status === "critical"
                  ? "إجهاد حراري"
                  : tempReading?.assessment.status === "warning"
                  ? "انحراف طفيف"
                  : "مثالي"}
              </Badge>
            </div>

            {/* Humidity Gauge */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">الرطوبة النسبية</span>
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {humidityReading ? `${humidityReading.numericValue}%` : "60.0%"}
              </p>
              <Badge
                variant={
                  humidityReading?.assessment.status === "warning" ? "secondary" : "outline"
                }
                className="text-[10px]"
              >
                {humidityReading?.assessment.status === "warning" ? "تنبيه رطوبة" : "مثالي (50-70%)"}
              </Badge>
            </div>

            {/* Ammonia Gauge */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">غاز الأمونيا NH3</span>
                <Wind className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {nh3Reading ? `${nh3Reading.numericValue} ppm` : "12 ppm"}
              </p>
              <Badge
                variant={
                  nh3Reading?.assessment.status === "critical"
                    ? "destructive"
                    : nh3Reading?.assessment.status === "warning"
                    ? "secondary"
                    : "outline"
                }
                className="text-[10px]"
              >
                {nh3Reading?.assessment.status === "critical"
                  ? "خطر تهوية"
                  : nh3Reading?.assessment.status === "warning"
                  ? "مرتفع"
                  : "آمن (<20 ppm)"}
              </Badge>
            </div>

            {/* CO2 Gauge */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">ثاني أكسيد الكربون</span>
                <Gauge className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {co2Reading ? `${co2Reading.numericValue} ppm` : "1,600 ppm"}
              </p>
              <Badge
                variant={co2Reading?.assessment.status === "critical" ? "destructive" : "outline"}
                className="text-[10px]"
              >
                {co2Reading?.assessment.status === "critical" ? "حرج" : "طبيعي"}
              </Badge>
            </div>

            {/* Static Pressure Gauge */}
            <div className="p-3.5 rounded-xl border bg-card space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">الضغط الاستاتيكي</span>
                <Zap className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold font-mono">
                {pressureReading ? `${pressureReading.numericValue} Pa` : "22.5 Pa"}
              </p>
              <Badge variant="outline" className="text-[10px]">
                نفق هوائي سليم
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnvironmentalSensorsPanel;
