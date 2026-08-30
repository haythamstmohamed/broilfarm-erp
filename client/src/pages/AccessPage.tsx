import React, { useState } from "react";
import { useWorkspaceContext } from "@/contexts/WorkspaceContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Plus, Copy, Check, UserPlus, Key } from "lucide-react";
import { toast } from "sonner";
import { farmRoles, roleLabels, type FarmRole } from "../../../shared/accessControl";

export default function AccessPage() {
  const { workspace, activeFarmId, activeFarm, refetch } = useWorkspaceContext();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<FarmRole>("supervisor");
  const [maxUses, setMaxUses] = useState("1");
  const [notes, setNotes] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const createInviteMutation = trpc.workspace.createInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("تم إنشاء كود الدعوة بنجاح");
      setCreatedCode(data.code);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الدعوة");
    },
  });

  const revokeInviteMutation = trpc.workspace.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء الدعوة");
      refetch();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFarmId) {
      toast.error("يرجى اختيار مزرعة أولاً");
      return;
    }
    createInviteMutation.mutate({
      farmId: activeFarmId,
      role: selectedRole,
      maxUses: parseInt(maxUses, 10) || 1,
      notes: notes.trim() || undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("تم نسخ كود الدعوة إلى الحافظة");
  };

  const invitations = (workspace?.invitations || []).filter((i) => i.farmId === activeFarmId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة صلاحيات الفريق</h1>
          <p className="text-sm text-muted-foreground mt-1">
            إنشاء أكواد دعوة وتعيين الأدوار الوظيفية (مدير، بيطري، مهندس، محاسب، مشرف)
          </p>
        </div>
        <Button onClick={() => { setIsInviteOpen(true); setCreatedCode(null); }} className="gap-2 self-start sm:self-auto">
          <UserPlus className="w-4 h-4" />
          دعوة عضو جديد
        </Button>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">أكواد الدعوة النشطة لمزرعة {activeFarm?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground text-xs font-semibold">
                    <th className="p-3">بادئة الكود</th>
                    <th className="p-3">الدور الممنوح</th>
                    <th className="p-3">الاستخدام</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-mono font-bold text-foreground">
                        {inv.codePrefix}••••••••
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="font-semibold">
                          {roleLabels[inv.role] || inv.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {inv.usedCount} من {inv.maxUses}
                      </td>
                      <td className="p-3">
                        <Badge variant={inv.status === "active" ? "default" : "secondary"}>
                          {inv.status === "active" ? "نشط" : "ملغى / منتهي"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        {inv.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 text-xs"
                            onClick={() => revokeInviteMutation.mutate({ invitationId: inv.id })}
                          >
                            إلغاء الكود
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              لا توجد دعوات مسجلة حالياً لهذه المزرعة.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إنشاء كود دعوة لفريق العمل</DialogTitle>
            <DialogDescription>
              حدد الدور الوظيفي لتوليد كود دخول آمن
            </DialogDescription>
          </DialogHeader>

          {createdCode ? (
            <div className="space-y-4 py-4 text-center">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-emerald-800">تم توليد كود الدعوة بنجاح!</p>
                <div className="text-xl font-mono font-black text-emerald-950 tracking-wider">
                  {createdCode}
                </div>
                <p className="text-[11px] text-emerald-700">
                  انسخ هذا الكود وأرسله للشخص المدعو ليتمكن من الانضمام فوراً.
                </p>
              </div>
              <Button onClick={() => copyToClipboard(createdCode)} className="w-full gap-2">
                <Copy className="w-4 h-4" />
                نسخ الكود
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="role">الدور الوظيفي *</Label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as FarmRole)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium"
                >
                  {farmRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabels[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxUses">أقصى عدد لاستخدام الكود</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">ملاحظات أو اسم الشخص المدعو</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: دعوة المهندس أحمد - مشرف العنبر"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={createInviteMutation.isPending}>
                  {createInviteMutation.isPending ? "جارٍ التوليد…" : "توليد كود الدعوة"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
