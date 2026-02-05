import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, School, Shield, Users, FileText, BarChart3 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Mentalaba.uz</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/super-admin/login">
              <Button variant="ghost">Super Admin</Button>
            </Link>
            <Link to="/school/login">
              <Button>Maktab kirish</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Maktablar uchun
            <span className="block text-primary">test boshqaruv tizimi</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Mentalaba.uz platformasi orqali o'quvchilarni ro'yxatdan o'tkazing,
            testlarni boshqaring va natijalarni kuzating.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/school/login">
              <Button size="lg" className="min-w-[200px]">
                <School className="mr-2 h-5 w-5" />
                Maktab sifatida kirish
              </Button>
            </Link>
            <Link to="/super-admin/login">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                <Shield className="mr-2 h-5 w-5" />
                Super Admin
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <School className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Maktablar boshqaruvi</CardTitle>
              <CardDescription>
                Barcha maktablarni bir joydan boshqaring va nazorat qiling
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>O'quvchilar ro'yxati</CardTitle>
              <CardDescription>
                O'quvchilarni testlarga ro'yxatdan o'tkazing va ularning ma'lumotlarini saqlang
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <CardTitle>Test natijalari</CardTitle>
              <CardDescription>
                Test natijalarini kuzating, tahlil qiling va eksport qiling
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <BarChart3 className="h-6 w-6 text-warning" />
              </div>
              <CardTitle>Statistika</CardTitle>
              <CardDescription>
                Maktab va viloyatlar bo'yicha batafsil statistika va hisobotlar
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm" style={{ animationDelay: "0.4s" }}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Xavfsiz tizim</CardTitle>
              <CardDescription>
                Har bir maktab faqat o'z ma'lumotlarini ko'rishi mumkin
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="animate-slide-in border-0 bg-card/50 backdrop-blur-sm" style={{ animationDelay: "0.5s" }}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Til sertifikatlari</CardTitle>
              <CardDescription>
                IELTS, CEFR va boshqa til sertifikatlarini hisobga oling
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Mentalaba.uz - Barcha huquqlar himoyalangan</p>
        </div>
      </footer>
    </div>
  );
}
