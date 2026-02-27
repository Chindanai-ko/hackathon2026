import { Icon, SeverityBadge, PulseMicButton, Header, BottomNav, EntryCard } from '../components/SharedUI'

// ─── Onboarding Fields Config ───
const onboardingFields = [
    { key: 'name', label: 'ชื่อของคุณ', placeholder: 'กรอกชื่อ-นามสกุล', icon: 'person', type: 'text' },
    { key: 'age', label: 'อายุของคุณ', placeholder: 'กรอกอายุ (ปี)', icon: 'cake', type: 'number' },
    { key: 'gender', label: 'เพศของคุณ', placeholder: '', icon: 'wc', type: 'select', options: ['ชาย', 'หญิง', 'อื่นๆ'] },
    { key: 'diseases', label: 'โรคประจำตัว', placeholder: 'เช่น เบาหวาน, ความดันสูง', icon: 'healing', type: 'text' },
    { key: 'medications', label: 'ยาที่ทานประจำ', placeholder: 'เช่น Metformin, Amlodipine', icon: 'medication', type: 'text' },
]

// ════════════════════════════════════════
// ONBOARDING VIEW
// ════════════════════════════════════════
function OnboardingView({ state }) {
    const { onboardingStep, elderlyProfile, setElderlyProfile, handleOnboardingNext, handleOnboardingBack, isSyncing } = state
    const field = onboardingFields[onboardingStep - 1]

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between p-4 pt-8">
                <button onClick={handleOnboardingBack} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Icon name="arrow_back" style={{ fontSize: '28px' }} className="text-slate-900" />
                </button>
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i <= onboardingStep ? 'w-8 bg-primary' : 'w-2 bg-slate-200'}`} />
                    ))}
                </div>
                <div className="w-10" />
            </header>

            <main className="flex-1 flex flex-col justify-center px-6 py-8 gap-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name={field.icon} style={{ fontSize: '40px' }} className="text-primary" />
                    </div>
                    <h1 className="text-[28px] font-bold text-slate-900 text-center leading-tight">{field.label}</h1>
                    <p className="text-lg text-slate-500 text-center">ขั้นตอนที่ {onboardingStep} จาก 5</p>
                </div>

                {field.type === 'select' ? (
                    <div className="flex flex-col gap-3">
                        {field.options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => setElderlyProfile(p => ({ ...p, [field.key]: opt }))}
                                className={`w-full h-16 rounded-xl text-xl font-semibold transition-all ${elderlyProfile[field.key] === opt
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'bg-white text-slate-900 border border-slate-200 hover:border-primary'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={elderlyProfile[field.key]}
                        onChange={(e) => setElderlyProfile(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full h-16 rounded-xl border border-slate-200 px-5 text-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    />
                )}
            </main>

            <footer className="p-6 pb-10">
                <button
                    onClick={handleOnboardingNext}
                    disabled={!elderlyProfile[field.key] || isSyncing}
                    className="w-full h-16 rounded-xl bg-primary hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 text-white text-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                >
                    {isSyncing ? 'กำลังบันทึก...' : onboardingStep === 5 ? 'เริ่มใช้งาน' : 'ถัดไป'}
                    {!isSyncing && <Icon name={onboardingStep === 5 ? 'check_circle' : 'arrow_forward'} style={{ fontSize: '24px' }} />}
                </button>
            </footer>
        </div>
    )
}

// ════════════════════════════════════════
// DASHBOARD VIEW
// ════════════════════════════════════════
function DashboardView({ state }) {
    const { elderlyProfile, pairingCode, entries, handleStartRecording } = state

    const navItems = [
        { icon: 'home', label: 'หน้าหลัก' },
        { icon: 'mic', label: 'บันทึก', onClick: handleStartRecording },
        { icon: 'settings', label: 'ตั้งค่า' },
    ]

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Voice-Care Diary" subtitle={`สวัสดี, คุณ${elderlyProfile.name || 'ผู้ใช้'}`} />

            <main className="flex-1 flex flex-col p-6 gap-8 w-full">
                {/* Pairing Code */}
                <section className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-5 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <Icon name="link" style={{ fontSize: '24px' }} className="text-white/80" />
                        <p className="text-base font-medium text-white/80">รหัสสำหรับญาติ</p>
                    </div>
                    <p className="text-4xl font-bold tracking-[0.15em] text-center py-2">{pairingCode}</p>
                    <p className="text-sm text-white/70 text-center mt-2">แสดงรหัสนี้ให้ลูกหลานเพื่อเชื่อมต่อ</p>
                </section>

                {/* Mic Button */}
                <section className="flex flex-col items-center justify-center py-6 gap-8 flex-1">
                    <h2 className="text-[32px] font-bold text-center text-slate-900 leading-tight">
                        กดเพื่อพูด<br />บอกอาการ
                    </h2>
                    <PulseMicButton onClick={handleStartRecording} />
                    <p className="text-lg text-slate-500 text-center max-w-[280px]">
                        แตะปุ่มไมโครโฟนเพื่อเริ่มบันทึกอาการป่วยของคุณวันนี้
                    </p>
                </section>

                {/* History */}
                <section className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-slate-900">ประวัติย้อนหลัง</h3>
                        <span className="text-sm text-slate-400">{entries.length} รายการ</span>
                    </div>
                    {entries.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                            <Icon name="history" style={{ fontSize: '48px' }} className="text-slate-300 mb-3" />
                            <p className="text-slate-400 text-lg">ยังไม่มีประวัติ</p>
                            <p className="text-slate-400 text-base">ลองกดบันทึกเสียงเพื่อเริ่มต้น</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {entries.map(entry => <EntryCard key={entry.id} entry={entry} />)}
                        </div>
                    )}
                </section>
            </main>

            <BottomNav items={navItems} activeIndex={0} />
        </div>
    )
}

// ════════════════════════════════════════
// RECORDING VIEW
// ════════════════════════════════════════
function RecordingView({ state }) {
    const { recordingTime, formatTime, handleStopRecording, handleCancelRecording } = state

    return (
        <div className="flex flex-col min-h-screen bg-background-light">
            <header className="flex items-center justify-between p-4 pt-8 pb-2 z-10">
                <button onClick={handleCancelRecording} className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-900">
                    <Icon name="close" style={{ fontSize: '28px' }} />
                </button>
                <h2 className="text-lg font-bold flex-1 text-center pr-12 text-slate-900">กำลังบันทึกเสียง</h2>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center w-full px-6">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">กำลังฟังอยู่...</h1>
                    <p className="text-xl text-slate-600 font-medium">กรุณาพูดอาการของคุณ</p>
                </div>

                {/* Waveform */}
                <div className="w-full max-w-sm h-48 flex items-center justify-center gap-1.5 mb-12">
                    {[8, 12, 6, 16, 24, 36, 28, 14, 20, 10, 4, 8].map((h, i) => (
                        <div
                            key={i}
                            className="w-2 rounded-full animate-pulse"
                            style={{
                                height: `${h * 4}px`,
                                backgroundColor: `rgba(19, 91, 236, ${0.2 + (h / 36) * 0.8})`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Timer Card */}
                <div className="w-full max-w-sm bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 h-14 w-14 rounded-lg flex items-center justify-center shrink-0">
                            <Icon name="mic" className="text-primary text-3xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-900 text-lg font-bold truncate">บันทึกเสียง</p>
                            <p className="text-primary text-base font-medium">{formatTime(recordingTime)}</p>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                    </div>
                </div>
            </main>

            <footer className="p-6 pb-10 w-full flex justify-center">
                <button
                    onClick={handleStopRecording}
                    className="w-full max-w-sm h-16 rounded-xl bg-primary hover:bg-primary-dark text-white text-xl font-bold tracking-wide shadow-lg shadow-primary/25 flex items-center justify-center gap-3 transition-transform active:scale-95"
                >
                    <Icon name="check_circle" style={{ fontSize: '24px' }} />
                    <span>เสร็จสิ้น</span>
                </button>
            </footer>
        </div>
    )
}

// ════════════════════════════════════════
// PROCESSING VIEW
// ════════════════════════════════════════
function ProcessingView() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-8">
            <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-primary animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="psychology" style={{ fontSize: '48px' }} className="text-primary" />
                </div>
            </div>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">กำลังสรุปผล...</h1>
                <p className="text-lg text-slate-500">AI กำลังวิเคราะห์อาการของคุณ</p>
            </div>
            <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════
// RESULT VIEW
// ════════════════════════════════════════
function ResultView({ state }) {
    const { getCurrentMock, handleSaveEntry, navigateTo, isSyncing } = state
    const mock = getCurrentMock()

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-center justify-center p-6 pt-8 pb-4">
                <h2 className="text-slate-900 text-xl font-bold">ผลการวิเคราะห์</h2>
            </div>

            <div className="flex flex-1 flex-col px-6 py-4 gap-6">
                {/* Summary Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon name="summarize" style={{ fontSize: '28px' }} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">สรุปอาการ</p>
                            <div className="flex items-center gap-2">
                                <p className="text-slate-900 text-lg font-bold">การวิเคราะห์ AI</p>
                                <SeverityBadge severity={mock.severity} color={mock.severityColor} />
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-700 text-lg leading-relaxed">{mock.summary}</p>
                </div>

                {/* Transcript Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                        <Icon name="record_voice_over" style={{ fontSize: '24px' }} className="text-slate-400" />
                        <p className="text-slate-500 text-base font-medium">เสียงที่บันทึก</p>
                    </div>
                    <p className="text-slate-600 text-base italic">"{mock.transcript}"</p>
                </div>

                {/* Mood Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Icon name="sentiment_satisfied" style={{ fontSize: '32px' }} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">อารมณ์</p>
                            <p className="text-slate-900 text-xl font-bold">{mock.mood}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 px-6 pb-10 w-full">
                <button
                    onClick={handleSaveEntry}
                    disabled={isSyncing}
                    className="flex w-full items-center justify-center rounded-xl h-16 px-6 bg-primary text-white text-xl font-bold hover:bg-primary-dark transition-colors shadow-md gap-2 active:scale-[0.97] disabled:bg-slate-300"
                >
                    {isSyncing ? (
                        <>
                            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                            <span>กำลังบันทึก...</span>
                        </>
                    ) : (
                        <>
                            <Icon name="save" style={{ fontSize: '24px' }} />
                            <span>บันทึกลงสมุดสุขภาพ</span>
                        </>
                    )}
                </button>
                <button
                    onClick={() => navigateTo('ELDERLY_DASHBOARD')}
                    className="flex w-full items-center justify-center rounded-xl h-16 px-6 bg-slate-200 text-slate-900 text-xl font-bold hover:bg-slate-300 transition-colors"
                >
                    ยกเลิก
                </button>
            </div>
        </div>
    )
}

// ════════════════════════════════════════
// MAIN ELDERLY VIEW (Router)
// ════════════════════════════════════════
export default function ElderlyView({ state }) {
    switch (state.currentView) {
        case 'ELDERLY_ONBOARDING': return <OnboardingView state={state} />
        case 'ELDERLY_DASHBOARD': return <DashboardView state={state} />
        case 'ELDERLY_RECORDING': return <RecordingView state={state} />
        case 'ELDERLY_PROCESSING': return <ProcessingView />
        case 'ELDERLY_RESULT': return <ResultView state={state} />
        default: return <DashboardView state={state} />
    }
}
