import React, { useMemo, useState } from 'react';
import { Copy, Check, Play, RefreshCw, Link2 } from 'lucide-react';
import {
  buildBattleInviteLink,
  generateBattleSeedCode,
} from '../multiplayer/battleProtocol';
import { formatFaNumber } from '../utils/formatFa';
import { PlayerProgress } from '../types/game';

interface NailBattleViewProps {
  progress: PlayerProgress;
  onStartSeededTrial: (seedString: string) => void;
}

export const NailBattleView: React.FC<NailBattleViewProps> = ({
  progress,
  onStartSeededTrial,
}) => {
  const [seedCode, setSeedCode] = useState<string>(() => generateBattleSeedCode());
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => buildBattleInviteLink(seedCode), [seedCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl surface-25d border border-[#EBCAD6] p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-[#9A2353]">
              نبرد ناخن · آماده برای رقابت آنلاین دو نفره
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#351427] mt-1 [text-wrap:balance]">
              دوئل آنلاین طراحی ناخن با تخته یکسان
            </h1>
            <p className="mt-2 text-sm text-[#5E354A] leading-relaxed">
              رقابت هم‌زمان دو بازیکن آنلاین برای فاز بعدی طراحی شده است. در این نسخه تک‌نفره هیچ بازیکن ساختگی یا ربات نمایش داده نمی‌شود، اما می‌توانید لینک دعوت اتاق خصوصی را ببینید و با همان موتور سیدبندی‌شده یک چالش آزمایشی واقعی بازی کنید.
            </p>
          </div>

          {progress.battleBestScore > 0 && (
            <div className="rounded-2xl bg-[#FDF1F5] border border-[#EBCAD6] px-5 py-4 shrink-0">
              <div className="text-xs font-bold text-[#6C3B53]">
                بهترین امتیاز نبرد آزمایشی
              </div>
              <div className="font-display text-2xl font-bold text-[#351427] tabular-nums mt-0.5">
                {formatFaNumber(progress.battleBestScore)}
              </div>
              {progress.battleBestSeed && (
                <div className="text-xs text-[#9A2353] mt-0.5" dir="ltr">
                  {progress.battleBestSeed}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-3xl surface-25d border border-[#EBCAD6] p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#351427]">
              آزمون چالش با کد سید یکسان
            </h2>
            <p className="mt-1.5 text-sm text-[#5E354A] leading-relaxed">
              هر دو بازیکن با وارد کردن یک کد سید مشترک، دقیقاً چیدمان اولیه یکسان، کاشی‌های گل یخی مشابه، تعداد حرکت برابر و ترتیب سقوط مهره‌های یکسان دریافت می‌کنند.
            </p>

            <div className="mt-5 space-y-3">
              <label
                htmlFor="battle-seed-input"
                className="block text-xs font-bold text-[#5E354A]"
              >
                کد اتاق نبرد (Seed)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="battle-seed-input"
                  type="text"
                  dir="ltr"
                  value={seedCode}
                  onChange={(e) => setSeedCode(e.target.value.toUpperCase().slice(0, 16))}
                  className="flex-1 min-w-[180px] min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FDF1F5] border border-[#E4BCCB] text-sm font-bold text-[#351427] tracking-wide focus-visible:outline-2 focus-visible:outline-[#E23B78]"
                />
                <button
                  type="button"
                  onClick={() => setSeedCode(generateBattleSeedCode())}
                  className="min-h-[44px] px-4 py-2 rounded-xl btn-3d-pearl border border-[#EBCAD6] text-xs font-bold text-[#351427] inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>کد جدید</span>
                </button>
              </div>

              <div className="rounded-xl bg-[#FAF3F6] border border-[#EFE0E6] p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 text-xs text-[#5E354A]" dir="ltr">
                  <Link2 className="w-4 h-4 shrink-0 text-[#9A2353]" />
                  <span className="truncate">{inviteUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-white border border-[#E4BCCB] text-xs font-bold text-[#351427] inline-flex items-center gap-1.5 shrink-0 hover:bg-[#FDF1F5]"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#15806B]" />
                      <span>کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی لینک دعوت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2DCE4] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#6C3B53]">
              ۲۰ حرکت · چیدمان و شانس کاملاً برابر · تمرین تک‌نفره فعال
            </span>
            <button
              type="button"
              disabled={!seedCode.trim()}
              onClick={() => onStartSeededTrial(seedCode.trim() || 'ROSE-1001')}
              className="min-h-[48px] px-6 py-2.5 rounded-2xl btn-3d-rose disabled:opacity-45 text-white font-bold text-sm inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current rotate-180" />
              <span>شروع چالش آزمایشی</span>
            </button>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-3xl surface-25d border border-[#EBCAD6] p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[#351427]">
              ساختار عادلانه رقابت دو نفره
            </h2>
            <p className="mt-1.5 text-sm text-[#5E354A]">
              معماری ماژولار بازی طوری طراحی شده که سرور آنلاین مستقیماً به همین صفحه پازل متصل شود:
            </p>
            <ol className="mt-4 space-y-3 text-xs sm:text-sm text-[#4F2D3D]">
              <li>
                <strong className="text-[#351427]">۱. اتاق خصوصی و لینک دعوت</strong> — ساخت شناسه اتاق و ارسال لینک اختصاصی برای دوست.
              </li>
              <li>
                <strong className="text-[#351427]">۲. تخته همگام با کد سید</strong> — تولید جدول یکسان با الگوریتم Mulberry32 برای هر دو نفر.
              </li>
              <li>
                <strong className="text-[#351427]">۳. ثبت حرکت‌ها و تایید سرور</strong> — ارسال مختصات هر جابه‌جایی و زمان برای بررسی منصفانه امتیاز.
              </li>
              <li>
                <strong className="text-[#351427]">۴. صفحه اعلام برنده</strong> — نمایش امتیاز هر دو بازیکن، حرکت‌های باقی‌مانده و برنده نهایی.
              </li>
            </ol>
          </div>

          <div className="rounded-xl bg-[#FDF1F5] border border-[#EBCAD6] px-4 py-3 text-xs text-[#7A4D62]">
            وضعیت: اتصال آنلاین هنوز فعال نشده تا هیچ بازیکن ساختگی به جای رقیب واقعی نمایش داده نشود.
          </div>
        </section>
      </div>
    </div>
  );
};
