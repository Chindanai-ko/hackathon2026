import { Icon, SeverityBadge, Header, BottomNav, EntryCard } from '../components/SharedUI'

// ════════════════════════════════════════
// LINKING VIEW (Keypad)
// ════════════════════════════════════════
function LinkingView({ state }) {
    const { inputCode, handleKeypadPress, handleKeypadDelete, handleLink, navigateTo, isSyncing } = state

    return (
        <div className="flex flex-col min-h-screen">
            <header className="flex items-center justify-between p-4 pt-8">
                <button onClick={() => navigateTo('ROLE_SELECTION')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <Icon name="arrow_back" style={{ fontSize: '28px' }} className="text-slate-900" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">เชื่อมต่อกับผู้สูงอายุ</h2>
                <div className="w-10" />
            </header>

            <main className="flex-1 flex flex-col items-center px-6 pt-4 gap-5">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Icon name="link" style={{ fontSize: '36px' }} className="text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">กรอกรหัสเชื่อมต่อ</h1>
                    <p className="text-base text-slate-500">ใส่รหัส 6 หลักจากแอปผู้สูงอายุ</p>
                </div>

                {/* Code Display */}
                <div className="flex gap-2 items-center justify-center">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${inputCode[i] ? 'border-primary bg-primary/5 text-slate-900' : 'border-slate-200 bg-white text-slate-300'
                            }`}>
                            {inputCode[i] || '•'}
                        </div>
                    ))}
                    <span className="text-2xl font-bold text-slate-300 mx-1">-</span>
                    {[3, 4, 5].map(i => (
                        <div key={i} className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold ${inputCode[i] ? 'border-primary bg-primary/5 text-slate-900' : 'border-slate-200 bg-white text-slate-300'
                            }`}>
                            {inputCode[i] || '•'}
                        </div>
                    ))}
                </div>

                {/* Connect Button */}
                <button
                    onClick={handleLink}
                    disabled={inputCode.length < 6 || isSyncing}
                    className="w-full h-14 rounded-xl bg-primary hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 text-white text-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                >
                    {isSyncing ? (
                        <>
                            <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                            <span>กำลังค้นหา...</span>
                        </>
                    ) : (
                        <>
                            <Icon name="link" style={{ fontSize: '24px' }} />
                            <span>เชื่อมต่อ</span>
                        </>
                    )}
                </button>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 w-full mt-auto pb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((digit, i) => {
                        if (digit === null) return <div key={i} />
                        if (digit === 'del') {
                            return (
                                <button key={i} onClick={handleKeypadDelete} className="keypad-btn bg-transparent hover:bg-slate-100">
                                    <Icon name="backspace" style={{ fontSize: '28px' }} className="text-slate-600" />
                                </button>
                            )
                        }
                        return (
                            <button key={i} onClick={() => handleKeypadPress(digit.toString())} className="keypad-btn">
                                {digit}
                            </button>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}

// ════════════════════════════════════════
// CONNECTION SUCCESS VIEW
// ════════════════════════════════════════
function ConnectionSuccessView({ state }) {
    const { linkedProfile, navigateTo } = state

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex items-center justify-center p-6 pt-12 pb-4">
                <h2 className="text-slate-900 text-xl font-bold">เชื่อมต่อสำเร็จ</h2>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                <div className="flex flex-col items-center gap-8 w-full">
                    <div className="flex items-center justify-center rounded-full bg-green-100 p-8 mb-4 animate-pulse">
                        <Icon name="check_circle" className="text-success" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1, 'wght' 700" }} />
                    </div>

                    <div className="flex w-full flex-col items-center gap-3 text-center">
                        <h1 className="text-slate-900 text-3xl font-bold">เชื่อมต่อสำเร็จ!</h1>
                        <p className="text-slate-600 text-lg font-medium max-w-[320px]">คุณเชื่อมต่อกับผู้สูงอายุเรียบร้อยแล้ว</p>
                    </div>

                    {/* Linked Profile Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 w-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon name="person" style={{ fontSize: '36px' }} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900">{linkedProfile?.name || 'ผู้ใช้'}</p>
                                <p className="text-slate-500">อายุ {linkedProfile?.age || '-'} ปี • {linkedProfile?.gender || '-'}</p>
                            </div>
                        </div>
                        {linkedProfile?.diseases && (
                            <div className="flex items-center gap-2 text-slate-600 mt-2">
                                <Icon name="healing" style={{ fontSize: '20px' }} className="text-slate-400 shrink-0" />
                                <span className="text-base">โรคประจำตัว: {linkedProfile.diseases}</span>
                            </div>
                        )}
                        {linkedProfile?.medications && (
                            <div className="flex items-center gap-2 text-slate-600 mt-2">
                                <Icon name="medication" style={{ fontSize: '20px' }} className="text-slate-400 shrink-0" />
                                <span className="text-base">ยา: {linkedProfile.medications}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-10 w-full">
                <button
                    onClick={() => navigateTo('RELATIVE_DASHBOARD')}
                    className="flex w-full items-center justify-center rounded-xl h-16 px-6 bg-primary text-white text-xl font-bold hover:bg-primary-dark transition-colors shadow-md active:scale-[0.97]"
                >
                    ไปหน้าแดชบอร์ด
                </button>
            </div>
        </div>
    )
}

// ════════════════════════════════════════
// RELATIVE DASHBOARD VIEW
// ════════════════════════════════════════
function RelativeDashboardView({ state }) {
    const { linkedProfile, entries } = state

    const navItems = [
        { icon: 'home', label: 'หน้าหลัก' },
        { icon: 'history', label: 'ประวัติ' },
        { icon: 'settings', label: 'ตั้งค่า' },
    ]

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="ดูแลสุขภาพ" subtitle={`คุณ${linkedProfile?.name || 'ผู้สูงอายุ'}`} icon="monitor_heart" />

            <main className="flex-1 flex flex-col p-6 gap-6 w-full">
                {/* Call Button */}
                <button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 flex items-center justify-center gap-3 text-xl font-bold shadow-lg shadow-green-500/25 transition-all active:scale-[0.97]">
                    <span style={{ fontSize: '28px' }}>📞</span>
                    <span>โทรหาทันที</span>
                </button>

                {/* Linked Profile Summary */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name="person" style={{ fontSize: '32px' }} className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-bold text-slate-900">{linkedProfile?.name || 'ผู้สูงอายุ'}</p>
                            <p className="text-sm text-slate-500">อายุ {linkedProfile?.age || '-'} ปี • {linkedProfile?.diseases || 'ไม่มีโรคประจำตัว'}</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                            เชื่อมต่อแล้ว
                        </div>
                    </div>
                </div>

                {/* Health Entries Feed */}
                <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">บันทึกสุขภาพ</h3>
                    <span className="text-sm text-slate-400">{entries.length} รายการ</span>
                </div>

                {entries.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                        <Icon name="inbox" style={{ fontSize: '48px' }} className="text-slate-300 mb-3" />
                        <p className="text-slate-400 text-lg">ยังไม่มีบันทึก</p>
                        <p className="text-slate-400 text-base">เมื่อผู้สูงอายุบันทึกอาการ จะแสดงที่นี่อัตโนมัติ</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {entries.map(entry => <EntryCard key={entry.id} entry={entry} showAiLabel />)}
                    </div>
                )}
            </main>

            <BottomNav items={navItems} activeIndex={0} />
        </div>
    )
}

// ════════════════════════════════════════
// MAIN RELATIVE VIEW (Router)
// ════════════════════════════════════════
export default function RelativeView({ state }) {
    switch (state.currentView) {
        case 'RELATIVE_LINKING': return <LinkingView state={state} />
        case 'RELATIVE_CONNECTION_SUCCESS': return <ConnectionSuccessView state={state} />
        case 'RELATIVE_DASHBOARD': return <RelativeDashboardView state={state} />
        default: return <LinkingView state={state} />
    }
}
