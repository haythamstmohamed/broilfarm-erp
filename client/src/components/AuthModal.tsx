import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Lock, LogIn, Mail, Phone, ShieldCheck, User, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AuthModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCompany, setRegCompany] = useState("");

  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`مرحباً بك مجدداً ${data.user.name || ""}`);
      utils.auth.me.invalidate();
      utils.workspace.get.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "فشل تسجيل الدخول، تأكد من صحة البيانات");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`تم إنشاء حسابك وحساب المؤسسة بنجاح! مرحباً بك ${data.user.name || ""}`);
      utils.auth.me.invalidate();
      utils.workspace.get.invalidate();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "فشل إنشاء الحساب، يرجى المحاولة لاحقاً");
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      toast.error("يرجى ملء جميع الحقول الإلزامية");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
      return;
    }
    registerMutation.mutate({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone || undefined,
      companyName: regCompany || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold">بوابة الدخول — BroilFarm ERP</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            سجّل دخولك أو أنشئ حساباً جديداً لإدارة مزارعك وعنابر التسمين.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login" className="gap-1.5 text-xs font-semibold">
              <LogIn className="w-3.5 h-3.5" />
              تسجيل الدخول
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5 text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              إنشاء حساب جديد
            </TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login" className="space-y-4 pt-3">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  البريد الإلكتروني
                </Label>
                <Input
                  type="email"
                  dir="ltr"
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="text-left font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  كلمة المرور
                </Label>
                <Input
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="text-left"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full font-bold gap-2 mt-4"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "جاري التحقق..." : "تسجيل الدخول"}
              </Button>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register" className="space-y-4 pt-3">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  الاسم الكامل
                </Label>
                <Input
                  type="text"
                  placeholder="م. أحمد الشناوي"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder="ahmed@farm.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="text-left font-sans text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    رقم الهاتف (اختياري)
                  </Label>
                  <Input
                    type="tel"
                    dir="ltr"
                    placeholder="01012345678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="text-left font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  اسم الشركة / المزرعة (اختياري)
                </Label>
                <Input
                  type="text"
                  placeholder="مزارع الدلتا لإنتاج الدواجن"
                  value={regCompany}
                  onChange={(e) => setRegCompany(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  كلمة المرور (6 أحرف على الأقل)
                </Label>
                <Input
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="text-left"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full font-bold gap-2 mt-4"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء حساب المؤسسة والبدء"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
