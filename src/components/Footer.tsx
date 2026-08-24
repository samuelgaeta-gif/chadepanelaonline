export default function Footer() {
  return (
    <footer className="w-full bg-[#fdfaf7] border-t border-slate-100 py-6 mt-auto">
      <div className="w-full max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center relative gap-4">
        <div className="flex items-center md:absolute md:left-6">
          <img src="/logochaN.png" alt="Chá de Panela Online" className="h-10 object-contain grayscale opacity-60" />
        </div>
        <div className="w-full text-center text-xs text-slate-500 leading-relaxed md:px-32">
          Chá de Panela Online é uma plataforma desenvolvida e operada pela Agência Live | CNPJ: 10.368.267/0001-90
        </div>
      </div>
    </footer>
  );
}
