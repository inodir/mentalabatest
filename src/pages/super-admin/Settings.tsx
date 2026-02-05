import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getApiSettings, saveApiSettings, isValidUrl, normalizeUrl, fetchDTMUsers } from "@/lib/dtm-api";
import { Settings as SettingsIcon, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const [mainUrl, setMainUrl] = useState("https://dtm-api.misterdev.uz/");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const settings = getApiSettings();
    if (settings) {
      setMainUrl(settings.mainUrl);
      setApiKey(settings.apiKey);
    }
  }, []);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key talab qilinadi",
        description: "Iltimos, API kalitini kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(mainUrl)) {
      toast({
        title: "URL noto'g'ri",
        description: "URL http:// yoki https:// bilan boshlanishi kerak",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      await fetchDTMUsers({ mainUrl: normalizeUrl(mainUrl), apiKey }, 0, 1);
      setTestResult("success");
      toast({
        title: "Ulanish muvaffaqiyatli",
        description: "API bilan aloqa o'rnatildi",
      });
    } catch (err) {
      setTestResult("error");
      const message = err instanceof Error ? err.message : "Noma'lum xato";
      toast({
        title: "Ulanish xatosi",
        description: message === "API_KEY_INVALID" ? "API kaliti noto'g'ri" : "Serverga ulanib bo'lmadi",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key talab qilinadi",
        description: "Iltimos, API kalitini kiriting",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(mainUrl)) {
      toast({
        title: "URL noto'g'ri",
        description: "URL http:// yoki https:// bilan boshlanishi kerak",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      saveApiSettings({
        mainUrl: normalizeUrl(mainUrl),
        apiKey,
      });
      
      toast({
        title: "Saqlandi",
        description: "API sozlamalari muvaffaqiyatli saqlandi",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout variant="super">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
          <p className="text-muted-foreground">
            DTM API sozlamalari va integratsiya
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              DTM API Sozlamalari
            </CardTitle>
            <CardDescription>
              DTM API bilan bog'lanish uchun kerakli sozlamalar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="mainUrl">API URL (MAIN_URL)</Label>
              <Input
                id="mainUrl"
                type="url"
                placeholder="https://dtm-api.misterdev.uz/"
                value={mainUrl}
                onChange={(e) => {
                  setMainUrl(e.target.value);
                  setTestResult(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                DTM API ning asosiy URL manzili
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="API kalitingizni kiriting"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                DTM API uchun x-api-key header qiymati
              </p>
            </div>

            {testResult && (
              <Alert variant={testResult === "success" ? "default" : "destructive"}>
                <AlertDescription className="flex items-center gap-2">
                  {testResult === "success" ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      API bilan aloqa muvaffaqiyatli o'rnatildi
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      API bilan aloqa o'rnatilmadi. Sozlamalarni tekshiring.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !apiKey.trim()}
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tekshirilmoqda...
                  </>
                ) : (
                  "Ulanishni tekshirish"
                )}
              </Button>
              <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  "Saqlash"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
