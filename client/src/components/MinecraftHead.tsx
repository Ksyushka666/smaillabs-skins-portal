import { useState, type CSSProperties } from "react";

export type MinecraftHeadProps = {
  skinUrl?: string | null;
  username?: string;
  size?: number;
  className?: string;
};

function SkinFace({ skinUrl, position, className = "" }: { skinUrl: string; position: string; className?: string }) {
  return (
    <div
      className={`absolute inset-0 rounded-[18%] bg-cover bg-no-repeat shadow-[inset_0_0_0_1px_rgba(255,255,255,.2)] ${className}`}
      style={{ backgroundImage: `url(${skinUrl})`, backgroundPosition: position, backgroundSize: "800% 800%" }}
    />
  );
}

export default function MinecraftHead({ skinUrl, username, size = 112, className = "" }: MinecraftHeadProps) {
  const [failed, setFailed] = useState(false);
  const source = skinUrl && !failed ? skinUrl : null;
  const side = Math.max(56, Math.round(size * 0.78));

  return (
    <div
      className={`relative shrink-0 [perspective:700px] ${className}`}
      style={{ width: size, height: size, "--head-half": `${Math.round(size * 0.38)}px` } as CSSProperties}
      aria-label={username ? `3D голова ${username}` : "3D голова Minecraft"}
    >
      {source ? (
        <div
          className="absolute inset-[7%] [transform-style:preserve-3d] [transform:rotateX(-8deg)_rotateY(-22deg)] transition-transform duration-300 hover:[transform:rotateX(-4deg)_rotateY(-34deg)]"
          onError={() => setFailed(true)}
        >
          <SkinFace skinUrl={source} position="14.3% 14.3%" className="[transform:translateZ(var(--head-half))]" />
          <SkinFace skinUrl={source} position="28.6% 14.3%" className="[transform:rotateY(90deg)_translateZ(var(--head-half))]" />
          <SkinFace skinUrl={source} position="42.9% 14.3%" className="[transform:rotateY(180deg)_translateZ(var(--head-half))]" />
          <SkinFace skinUrl={source} position="0% 14.3%" className="[transform:rotateY(-90deg)_translateZ(var(--head-half))]" />
          <SkinFace skinUrl={source} position="14.3% 0%" className="[transform:rotateX(90deg)_translateZ(var(--head-half))]" />
          <SkinFace skinUrl={source} position="28.6% 0%" className="[transform:rotateX(-90deg)_translateZ(var(--head-half))]" />
          <div className="absolute inset-[-3%] rounded-[20%] border border-white/20 shadow-[0_18px_35px_rgba(10,30,60,.35)]" />
        </div>
      ) : (
        <div className="absolute inset-[10%] grid place-items-center rounded-[22%] border border-white/20 bg-gradient-to-br from-sky-400 to-orange-400 text-center text-white shadow-[0_18px_35px_rgba(10,30,60,.3)]">
          <span className="text-[10px] font-semibold uppercase tracking-widest">skin</span>
        </div>
      )}
      {source && <img src={source} alt="" className="hidden" onError={() => setFailed(true)} />}
      <div className="pointer-events-none absolute inset-x-[18%] bottom-0 h-2 rounded-full bg-slate-950/20 blur-md" />
    </div>
  );
}
