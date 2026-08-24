import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Heart } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular o envio
    setTimeout(() => {
      setMessage("Se o e-mail existir em nossa base, um link de recuperação será enviado.");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="flex items-center mb-6">
          <img src="/logochaN.png" alt="Chá de Panela Online" className="h-20 md:h-24 object-contain" />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="glass-panel border-0 mx-auto w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold font-serif text-[#333]">Recuperar Senha</CardTitle>
            <CardDescription className="text-slate-600">
              Digite seu e-mail para receber um link de redefinição.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              {message && <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-md">{message}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <div className="text-sm text-center text-slate-500">
                Lembrou sua senha?{" "}
                <Link to="/login" className="text-rose-600 hover:text-rose-500 font-medium">
                  Voltar para o login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
