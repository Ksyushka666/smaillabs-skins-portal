import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Crown, LogIn, Search, ShieldCheck, Sparkles, Upload, Users } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import MinecraftHead from "@/components/MinecraftHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const demoMembers = [
  { username: "YTSmailDog", role: "Основатель", skinUrl: "https://mc-heads.net/skin/YTSmailDog" },
  { username: "Milyasha_cherry", role: "Бета-тестер", skinUrl: "https://mc-heads.net/skin/Milyasha_cherry" },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [username, setUsername] = useState("YTSmailDog");
  const [lookupName, setLookupName] = useState("YTSmailDog");
  const lookup = trpc.minecraft.lookup.useQuery({ username: lookupName }, { enabled: lookupName.length > 2 });
  const catalog = trpc.skins.catalog.useQuery({ limit: 12 });
  const linkAccount = trpc.minecraft.link.useMutation();
  const [notice, setNotice] = useState<string | null>(null);

  const lookupSkin = useMemo(() => lookup.data?.skinUrl ?? undefined, [lookup.data?.skinUrl]);

  async function connectMinecraft() {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    const result = await lookup.refetch();
    if (!result.data) {
      setNotice("Лицензионный аккаунт не найден. Для TLauncher можно добавить профиль вручную по HTTPS-ссылке на скин.");
      return;
    }
    await linkAccount.mutateAsync({
      uuid: result.data.uuid,
      username: result.data.username,
      source: result.data.source,
      skinUrl: result.data.skinUrl ?? undefined,
      model: result.data.model,
    });
    setNotice(`Аккаунт ${result.data.username} привязан к профилю.`);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#071525] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,.2),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(249,115,22,.2),transparent_30%)]" />
      <header className="relative z-10 border-b border-white/10 bg-[#071525]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400 to-orange-400 text-[#071525] shadow-lg shadow-sky-500/20"><Sparkles size={20} /></div>
            <div><div className="font-black tracking-tight">SmailLabs</div><div className="text-[10px] uppercase tracking-[.22em] text-sky-200/60">Minecraft content team</div></div>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex"><a href="#skins" className="transition hover:text-white">Скины</a><a href="#team" className="transition hover:text-white">Команда</a><a href="#features" className="transition hover:text-white">Возможности</a></nav>
          {isAuthenticated ? <Button variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" onClick={() => logout()}>Выйти</Button> : <Button className="bg-white text-slate-900 hover:bg-sky-100" onClick={() => startLogin()}><LogIn size={16} /> Войти</Button>}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-12 lg:px-8 lg:pt-20">
        <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[.18em] text-sky-200"><Sparkles size={14} /> Skin portal beta</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.96] tracking-[-.055em] text-white md:text-7xl">Твой Minecraft-образ — <span className="bg-gradient-to-r from-sky-300 via-cyan-200 to-orange-300 bg-clip-text text-transparent">в центре команды.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Профили игроков, реальные скины Mojang и TLauncher, кастомные плащи, аксессуары и 3D-головы для SmailLabs.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button className="h-12 bg-gradient-to-r from-sky-400 to-cyan-300 px-6 font-bold text-slate-950 hover:from-sky-300 hover:to-cyan-200" onClick={() => document.getElementById("skins")?.scrollIntoView({ behavior: "smooth" })}>Открыть каталог <ArrowRight size={17} /></Button><Button variant="outline" className="h-12 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10" onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })}>Участники <Users size={17} /></Button></div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-300" /> Модерация ассетов</span><span className="flex items-center gap-2"><Crown size={16} className="text-orange-300" /> Плащи и аксессуары</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-md"><div className="absolute -inset-12 rounded-full bg-sky-400/20 blur-3xl" /><div className="relative rounded-[2rem] border border-white/15 bg-white/[.07] p-6 shadow-2xl shadow-sky-950/40 backdrop-blur-xl"><div className="mb-6 flex items-center justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-slate-400">Live profile</div><div className="mt-1 font-bold text-white">{lookup.data?.username ?? "YTSmailDog"}</div></div><div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200">online</div></div><div className="grid place-items-center rounded-3xl bg-gradient-to-br from-sky-400/20 via-slate-900/30 to-orange-400/20 py-8"><MinecraftHead skinUrl={lookupSkin ?? demoMembers[0].skinUrl} username={lookup.data?.username ?? "YTSmailDog"} size={190} /></div><div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm"><span className="text-slate-400">Источник скина</span><span className="font-semibold text-sky-200">{lookup.data?.source ?? "Mojang / NameMC"}</span></div></div></div>
        </section>

        <section id="team" className="mt-28 scroll-mt-20"><div className="mb-7 flex items-end justify-between"><div><div className="text-xs uppercase tracking-[.2em] text-orange-300">SmailLabs people</div><h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Основатели и тестеры</h2></div><span className="hidden text-sm text-slate-400 md:block">Реальные Minecraft-профили команды</span></div><div className="grid gap-4 md:grid-cols-2">{demoMembers.map(member => <Card key={member.username} className="border-white/10 bg-white/[.06] text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/[.09]"><CardContent className="flex items-center gap-5 p-5"><MinecraftHead skinUrl={member.skinUrl} username={member.username} size={96} /><div className="min-w-0"><div className="text-xs uppercase tracking-[.18em] text-sky-200/60">{member.role}</div><a className="mt-1 block truncate text-xl font-black hover:text-sky-200" href={`https://namemc.com/profile/${member.username}`} target="_blank" rel="noreferrer">{member.username}</a><div className="mt-3 flex gap-2 text-xs text-slate-400"><span className="rounded-full bg-white/10 px-2 py-1">NameMC</span><span className="rounded-full bg-white/10 px-2 py-1">3D skin</span></div></div><ChevronRight className="ml-auto text-slate-500" size={20} /></CardContent></Card>)}</div></section>

        <section id="skins" className="mt-28 scroll-mt-20"><div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="text-xs uppercase tracking-[.2em] text-sky-300">Skin database</div><h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">Каталог образов</h2></div><div className="flex gap-2"><Input value={username} onChange={event => setUsername(event.target.value)} className="h-11 w-48 border-white/15 bg-white/10 text-white placeholder:text-slate-500" placeholder="Ник Minecraft" /><Button className="h-11 bg-orange-400 text-slate-950 hover:bg-orange-300" onClick={() => { setLookupName(username); void connectMinecraft(); }}><Search size={16} /> Найти</Button></div></div>{notice && <div className="mb-5 rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">{notice}</div>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{catalog.data?.map(asset => <Card key={asset.id} className="overflow-hidden border-white/10 bg-white/[.06] text-white"><div className="grid place-items-center bg-gradient-to-br from-slate-900 to-sky-950 py-6"><MinecraftHead skinUrl={asset.previewUrl ?? asset.sourceUrl} username={asset.name} size={112} /></div><CardHeader className="pb-2"><CardTitle className="truncate text-base">{asset.name}</CardTitle></CardHeader><CardContent className="flex items-center justify-between pt-0 text-xs text-slate-400"><span className="uppercase tracking-widest">{asset.type}</span><span className="text-orange-200">{asset.priceCoins ? `${asset.priceCoins} coins` : "free"}</span></CardContent></Card>)}</div>{(!catalog.data || catalog.data.length === 0) && <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.04] p-10 text-center text-slate-400">Каталог готовится. Войдите, чтобы загрузить первый скин или плащ.</div>}</section>

        <section id="features" className="mt-28 grid gap-4 md:grid-cols-3"><Card className="border-white/10 bg-white/[.05] text-white"><CardContent className="p-6"><Upload className="mb-5 text-sky-300" /><h3 className="text-lg font-bold">Загрузка PNG</h3><p className="mt-2 text-sm leading-6 text-slate-400">Загрузите файл или укажите HTTPS-ссылку. Каждый ассет проходит проверку и модерацию.</p></CardContent></Card><Card className="border-white/10 bg-white/[.05] text-white"><CardContent className="p-6"><Crown className="mb-5 text-orange-300" /><h3 className="text-lg font-bold">Плащи и аксессуары</h3><p className="mt-2 text-sm leading-6 text-slate-400">Соберите loadout профиля, который будет доступен сайту и Fabric-моду.</p></CardContent></Card><Card className="border-white/10 bg-white/[.05] text-white"><CardContent className="p-6"><ShieldCheck className="mb-5 text-emerald-300" /><h3 className="text-lg font-bold">Профиль игрока</h3><p className="mt-2 text-sm leading-6 text-slate-400">Один Minecraft UUID связывает скин, плащ и 3D-голову с аккаунтом SmailLabs.</p></CardContent></Card></section>
      </main>
      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">SmailLabs · Minecraft content team · Skin portal beta · <a className="text-sky-300 hover:text-sky-200" href="https://smaillabs.onrender.com/" target="_blank" rel="noreferrer">Официальный сайт</a></footer>
    </div>
  );
}
