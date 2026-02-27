// ─── Shared UI Components ───
// Reusable, high-contrast, "Grandma-proof" components

// ─── Icon (Material Symbols wrapper) ───
export const Icon = ({ name, className = '', style = {}, fill = false }) => (
    <span className={`material-symbols-outlined ${fill ? 'fill' : ''} ${className}`} style={style}>{name}</span>
)

// ─── Severity Badge ───
export const SeverityBadge = ({ severity, color }) => {
    const colors = {
        green: 'bg-green-100 text-green-700',
        orange: 'bg-orange-100 text-orange-700',
        red: 'bg-red-100 text-red-700',
    }
    return (
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[color] || colors.green}`}>
            {severity}
        </span>
    )
}

// ─── Pulse Mic Button ───
export const PulseMicButton = ({ onClick }) => (
    <div className="relative group cursor-pointer" onClick={onClick}>
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500" />
        <div className="pulse-ring absolute inset-0 -m-4 rounded-full" />
        <button className="relative w-48 h-48 bg-primary hover:bg-primary-dark rounded-full shadow-glow flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 z-10">
            <Icon name="mic" className="text-white mb-2" style={{ fontSize: '64px' }} />
            <span className="text-white text-lg font-medium">บันทึกเสียง</span>
        </button>
    </div>
)

// ─── App Header ───
export const Header = ({ title, subtitle, icon = 'medical_services', rightAction }) => (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon name={icon} style={{ fontSize: '24px' }} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
        </div>
        {rightAction || (
            <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
                <Icon name="notifications" style={{ fontSize: '28px' }} />
            </button>
        )}
    </header>
)

// ─── Bottom Navigation ───
export const BottomNav = ({ items, activeIndex = 0 }) => (
    <nav className="sticky bottom-0 z-20 bg-white border-t border-slate-200 pb-safe pt-2">
        <div className="flex justify-around items-end h-16 px-2 pb-2">
            {items.map((item, i) => (
                <button
                    key={i}
                    onClick={item.onClick}
                    className={`flex flex-1 flex-col items-center justify-center gap-1 ${i === activeIndex ? '' : 'text-slate-500 hover:text-primary transition-colors'}`}
                >
                    <div className={i === activeIndex ? 'bg-primary/10 px-5 py-1 rounded-full' : 'px-5 py-1 rounded-full'}>
                        <Icon name={item.icon} fill={i === activeIndex} style={{ fontSize: '28px' }} className={i === activeIndex ? 'text-primary' : ''} />
                    </div>
                    <span className={i === activeIndex ? 'text-primary text-sm font-semibold' : 'text-sm font-medium'}>{item.label}</span>
                </button>
            ))}
        </div>
    </nav>
)

// ─── Entry Card (shared between elderly/relative) ───
export const EntryCard = ({ entry, showAiLabel = false }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {showAiLabel && <Icon name="schedule" style={{ fontSize: '18px' }} className="text-slate-400" />}
                <span className="text-sm text-slate-400">{entry.timestamp}</span>
            </div>
            <SeverityBadge severity={entry.severity} color={entry.severityColor} />
        </div>

        {showAiLabel ? (
            <div className="bg-primary/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                    <Icon name="psychology" style={{ fontSize: '20px' }} className="text-primary" />
                    <span className="text-sm font-semibold text-primary">สรุปจาก AI</span>
                </div>
                <p className="text-slate-800 text-base leading-relaxed">{entry.summary}</p>
            </div>
        ) : (
            <p className="text-slate-900 text-lg font-semibold">{entry.summary}</p>
        )}

        <div className="flex items-start gap-2 text-slate-500 text-sm">
            <Icon name={showAiLabel ? 'record_voice_over' : 'graphic_eq'} style={{ fontSize: '18px' }} className={showAiLabel ? 'mt-0.5 shrink-0' : ''} />
            <p className={showAiLabel ? 'italic' : 'truncate'}>
                {showAiLabel ? `"${entry.transcript}"` : entry.transcript}
            </p>
        </div>
    </div>
)

// ─── Syncing Overlay ───
export const SyncingOverlay = ({ show }) => {
    if (!show) return null
    return (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin-slow" />
                <p className="text-slate-900 text-lg font-semibold">กำลังบันทึก...</p>
            </div>
        </div>
    )
}

// ─── Auth Loading Screen ───
export const AuthLoadingScreen = () => (
    <div className="w-full max-w-md mx-auto min-h-screen bg-background-light shadow-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-primary animate-spin-slow" />
            <p className="text-slate-500 text-lg">กำลังเชื่อมต่อ...</p>
        </div>
    </div>
)
