export function FinancialPreview() {
  return (
    <div className="relative w-full max-w-[460px]">
      <div
        className="absolute -bottom-4 left-2.5 h-[70px] w-[400px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.5) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      <div
        className="relative z-[1] flex gap-3.5 rounded-[22px] p-5"
        style={{
          background: 'rgba(14,10,38,0.72)',
          border: '1px solid rgba(109,40,217,0.3)',
          backdropFilter: 'blur(20px)',
          boxShadow:
            '0 8px 48px rgba(60,20,180,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          transform: 'perspective(900px) rotateX(4deg) rotateY(-2deg)',
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="flex-[1.1] rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(8,6,22,0.85)', border: '1px solid rgba(109,40,217,0.22)' }}
        >
          <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.3px] text-[#34d399]">Safe to Spend</div>
          <div className="mb-1 text-2xl font-bold text-white">Rs. 2,150</div>
          <div className="mb-3 text-[10px] leading-[1.4] text-[#9482c8]/50">Estimated amount you can spend today</div>
          <div className="mb-2.5 h-1 overflow-hidden rounded bg-white/[0.07]">
            <div className="h-full w-[65%] rounded bg-gradient-to-r from-[#10b981] to-[#34d399]" />
          </div>
          <div className="flex justify-end">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
        </div>

        <div
          className="flex-1 rounded-2xl px-4 py-3.5"
          style={{ background: 'rgba(8,6,22,0.85)', border: '1px solid rgba(109,40,217,0.22)' }}
        >
          <div className="mb-1.5 text-[10.5px] font-semibold tracking-[0.3px] text-[#a78bfa]">Money Runway</div>
          <div className="mb-1 text-[26px] font-bold text-white">17 days</div>
          <div className="mb-2 text-[10px] leading-[1.4] text-[#9482c8]/50">Estimated days your money will last</div>
          <svg width="100%" height="44" viewBox="0 0 120 44" preserveAspectRatio="none">
            <defs>
              <linearGradient id="runwayFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              points="0,40 20,34 40,38 60,24 80,28 100,16 120,10"
              fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            />
            <polygon
              points="0,40 20,34 40,38 60,24 80,28 100,16 120,10 120,44 0,44"
              fill="url(#runwayFill)"
            />
          </svg>
        </div>

        <div
          className="absolute -bottom-[18px] -right-7 z-[3] flex h-[76px] w-[76px] items-center justify-center rounded-full text-[32px] text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)',
            border: '3px solid rgba(167,139,250,0.4)',
            boxShadow: '0 0 32px rgba(109,40,217,0.7), 0 0 64px rgba(79,70,229,0.35)',
          }}
        >
          ₹
        </div>
      </div>
    </div>
  )
}
