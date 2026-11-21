import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw, X } from 'lucide-react';

interface SettingsModalProps {
  soundMuted: boolean;
  onToggleSound: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  soundMuted,
  onToggleSound,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#230E18]/55 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-md rounded-3xl surface-25d border border-[#EBCAD6] p-6 text-[#351427]">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#F2DCE4]">
          <h2 id="settings-title" className="font-display text-2xl font-bold">
            تنظیمات سالن
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن تنظیمات"
            className="h-10 w-10 rounded-full hover:bg-[#FDF1F5] flex items-center justify-center text-[#5E354A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">افکت‌های صوتی و زنگ سالن</p>
              <p className="text-xs text-[#7A4D62] mt-0.5">
                صدای ترکیب مهره‌ها، آبشار امتیاز و ابزارهای ویژه
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleSound}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                soundMuted
                  ? 'btn-3d-pearl border border-[#E4BCCB] text-[#5E354A]'
                  : 'btn-3d-rose text-white'
              }`}
            >
              {soundMuted ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>بی‌صدا</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>صدا روشن</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-[#F2DCE4]">
            <p className="font-bold text-sm">راهنمای مهره‌ها و گره‌های سالن</p>
            <ul className="mt-2 space-y-1.5 text-xs text-[#5E354A] leading-relaxed">
              <li>• چیدن ۴ مهره در یک خط: قلم‌موی لیزری UV (پاکسازی یک ردیف یا ستون کامل)</li>
              <li>• چیدن مربع ۲×۲: پروانه سالن (پرواز هوشمند به سمت هدف یا کاشی یخی)</li>
              <li>• چیدن به شکل L یا T: بمب بافر کریستالی (انفجار ۳×۳)</li>
              <li>• چیدن ۵ مهره در یک خط: تاج منشوری (پاکسازی تمام مهره‌های هم‌رنگ)</li>
              <li>• گره روبان ساتن: مهره قفل شده با روبان را در جایش مچ کنید تا آزاد شود</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[#F2DCE4]">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl btn-3d-pearl border border-[#E4BCCB] text-sm font-bold text-[#9A2353]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازنشانی پیشرفت بازی</span>
              </button>
            ) : (
              <div className="rounded-2xl bg-[#FDF1F5] border border-[#E4BCCB] p-4">
                <p className="text-xs font-bold text-[#351427]">
                  آیا مطمئن هستید که می‌خواهید تمام ستاره‌ها، سکه‌ها، کارت‌ها و ارتقاهای ذخیره شده پاک شوند؟
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#B81D4E] text-white text-xs font-bold hover:bg-[#99153F]"
                  >
                    بله، پاک شود
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-white border border-[#E4BCCB] text-xs font-bold text-[#351427]"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
