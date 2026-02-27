import { Icon } from '../components/SharedUI'

export default function RoleSelectionView({ onSelectRole }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 gap-8">
            <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon name="medical_services" style={{ fontSize: '40px' }} className="text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 text-center">Voice-Care Diary</h1>
                <p className="text-lg text-slate-500 text-center">สมุดบันทึกสุขภาพด้วยเสียง</p>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center">คุณคือใคร?</h2>

            <div className="flex flex-col gap-4 w-full">
                <button
                    onClick={() => onSelectRole('elderly')}
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-2xl p-6 text-left transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Icon name="elderly" style={{ fontSize: '36px' }} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">ผู้สูงอายุ</p>
                            <p className="text-base text-white/80 mt-1">เริ่มใช้งานใหม่</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectRole('relative')}
                    className="w-full bg-white hover:bg-slate-50 text-slate-900 rounded-2xl p-6 text-left transition-all active:scale-[0.98] shadow-sm border border-slate-200"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon name="family_restroom" style={{ fontSize: '36px' }} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">ลูกหลาน/ญาติ</p>
                            <p className="text-base text-slate-500 mt-1">ดูแลสุขภาพผู้สูงอายุ</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    )
}
