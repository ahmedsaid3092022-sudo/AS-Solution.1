import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Layers,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';
import { WorkShift, ShiftType } from '../../types';
import { sqliteAdapter, INITIAL_SHIFTS } from '../../db/sqliteAdapter';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { Badge } from '../common/Badge';

interface ShiftManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShiftManagementModal: React.FC<ShiftManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, isRtl } = useLanguageStore();

  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form fields for create/edit
  const [shiftName, setShiftName] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [shiftType, setShiftType] = useState<ShiftType>('MORNING');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [color, setColor] = useState('cyan');
  const [isDefault, setIsDefault] = useState(false);

  const loadShifts = () => {
    const loaded = sqliteAdapter.getTable('shifts') || [];
    setShifts(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      loadShifts();
      setIsAddingNew(false);
      setEditingShift(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingShift(null);
    setShiftName('');
    setShiftCode(`SHIFT-${Math.floor(100 + Math.random() * 900)}`);
    setShiftType('MORNING');
    setStartTime('08:00');
    setEndTime('16:00');
    setGracePeriod(15);
    setColor('cyan');
    setIsDefault(shifts.length === 0);
    setIsAddingNew(true);
  };

  const handleStartEdit = (s: WorkShift) => {
    setIsAddingNew(false);
    setEditingShift(s);
    setShiftName(s.name);
    setShiftCode(s.code);
    setShiftType(s.type);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setGracePeriod(s.gracePeriodMinutes);
    setColor(s.color || 'cyan');
    setIsDefault(!!s.isDefault);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;

    let updatedList = [...shifts];

    if (isDefault) {
      // Unset default from others
      updatedList = updatedList.map((s) => ({ ...s, isDefault: false }));
    }

    if (editingShift) {
      updatedList = updatedList.map((s) =>
        s.id === editingShift.id
          ? {
              ...s,
              name: shiftName,
              code: shiftCode,
              type: shiftType,
              startTime,
              endTime,
              gracePeriodMinutes: Number(gracePeriod),
              color,
              isDefault,
            }
          : s
      );
    } else {
      const newShift: WorkShift = {
        id: `shift-${Date.now()}`,
        name: shiftName,
        code: shiftCode || `SHIFT-${Date.now().toString().slice(-4)}`,
        type: shiftType,
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriod),
        color,
        isDefault,
        isActive: true,
      };
      updatedList.push(newShift);
    }

    sqliteAdapter.updateTable('shifts', updatedList);
    setShifts(updatedList);
    setIsAddingNew(false);
    setEditingShift(null);
    if (onSuccess) onSuccess();
  };

  const handleDeleteShift = (id: string) => {
    if (shifts.length <= 1) {
      alert(isRtl ? 'لا يمكن حذف جميع الورادي. يجب بقاء وردية واحدة على الأقل.' : 'Cannot delete all shifts. At least one shift required.');
      return;
    }
    const filtered = shifts.filter((s) => s.id !== id);
    if (!filtered.some((s) => s.isDefault) && filtered.length > 0) {
      filtered[0].isDefault = true;
    }
    sqliteAdapter.updateTable('shifts', filtered);
    setShifts(filtered);
    if (onSuccess) onSuccess();
  };

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'SINGLE' | 'DOUBLE' | 'TRIPLE') => {
    let presetShifts: WorkShift[] = [];

    if (preset === 'SINGLE') {
      presetShifts = [
        {
          id: 'shift-1',
          name: 'الوردية الصباحية (النهارية)',
          code: 'SHIFT-MORNING',
          type: 'MORNING',
          startTime: '08:00',
          endTime: '16:00',
          gracePeriodMinutes: 15,
          color: 'cyan',
          isDefault: true,
          isActive: true,
        },
      ];
    } else if (preset === 'DOUBLE') {
      presetShifts = [
        {
          id: 'shift-1',
          name: 'الوردية النهارية (الصباحية)',
          code: 'SHIFT-DAY',
          type: 'MORNING',
          startTime: '08:00',
          endTime: '16:00',
          gracePeriodMinutes: 15,
          color: 'cyan',
          isDefault: true,
          isActive: true,
        },
        {
          id: 'shift-2',
          name: 'الوردية المسائية',
          code: 'SHIFT-EVENING',
          type: 'EVENING',
          startTime: '16:00',
          endTime: '00:00',
          gracePeriodMinutes: 15,
          color: 'amber',
          isDefault: false,
          isActive: true,
        },
      ];
    } else if (preset === 'TRIPLE') {
      presetShifts = [
        {
          id: 'shift-1',
          name: 'الوردية الأولى (صباحية)',
          code: 'SHIFT-MORNING',
          type: 'MORNING',
          startTime: '08:00',
          endTime: '16:00',
          gracePeriodMinutes: 15,
          color: 'cyan',
          isDefault: true,
          isActive: true,
        },
        {
          id: 'shift-2',
          name: 'الوردية الثانية (مسائية)',
          code: 'SHIFT-EVENING',
          type: 'EVENING',
          startTime: '16:00',
          endTime: '00:00',
          gracePeriodMinutes: 15,
          color: 'amber',
          isDefault: false,
          isActive: true,
        },
        {
          id: 'shift-3',
          name: 'الوردية الثالثة (ليلية)',
          code: 'SHIFT-NIGHT',
          type: 'NIGHT',
          startTime: '00:00',
          endTime: '08:00',
          gracePeriodMinutes: 15,
          color: 'purple',
          isDefault: false,
          isActive: true,
        },
      ];
    }

    sqliteAdapter.updateTable('shifts', presetShifts);
    setShifts(presetShifts);
    setIsAddingNew(false);
    setEditingShift(null);
    if (onSuccess) onSuccess();
  };

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case 'MORNING':
        return <Sun className="w-4 h-4 text-cyan-400" />;
      case 'EVENING':
        return <Sunset className="w-4 h-4 text-amber-400" />;
      case 'NIGHT':
        return <Moon className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">{t.shiftsManagement}</h2>
              <p className="text-slate-400 text-xs">تحديد وتخصيص ساعات العمل للوردية الواحدة، الورديتين، أو الورادي الثلاث</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Quick Presets Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-xs">{t.shiftPresets}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleApplyPreset('SINGLE')}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 rounded-xl text-right cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs group-hover:text-cyan-300">
                  <Sun className="w-4 h-4" />
                  <span>وردية واحدة</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">نظام دواوم قياسي نهاري (08:00 - 16:00)</p>
              </button>

              <button
                onClick={() => handleApplyPreset('DOUBLE')}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-xl text-right cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs group-hover:text-amber-300">
                  <Sunset className="w-4 h-4" />
                  <span>ورديتان (2 Shifts)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">نهاري (08:00-16:00) + مسائي (16:00-00:00)</p>
              </button>

              <button
                onClick={() => handleApplyPreset('TRIPLE')}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-purple-500/50 rounded-xl text-right cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs group-hover:text-purple-300">
                  <Moon className="w-4 h-4" />
                  <span>3 ورادي (24 ساعة)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">صباحية + مسائية + ليلية بالتبادل</p>
              </button>
            </div>
          </div>

          {/* Active Shifts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>الورادي المعرفة بالنظام ({shifts.length})</span>
              </h3>

              {!isAddingNew && !editingShift && (
                <button
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.addNewShift}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shifts.map((s) => (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    s.isDefault
                      ? 'bg-cyan-500/10 border-cyan-500/40'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {getShiftIcon(s.type)}
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                          {s.name}
                          {s.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md font-semibold">
                              الافتراضية
                            </span>
                          )}
                        </h4>
                        <span className="text-slate-400 text-[11px] font-mono">{s.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(s)}
                        className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title={t.editShift}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteShift(s.id)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title={t.deleteShift}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono bg-slate-900/60 p-2 rounded-xl border border-white/5">
                    <div className="text-slate-300">
                      <span>من: <strong className="text-emerald-400">{s.startTime}</strong></span>
                      <span className="mx-1.5 text-slate-600">|</span>
                      <span>إلى: <strong className="text-cyan-400">{s.endTime}</strong></span>
                    </div>
                    <span className="text-amber-400 text-[11px]">
                      سماح: {s.gracePeriodMinutes}د
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Section: Create or Edit Shift */}
          {(isAddingNew || editingShift) && (
            <form onSubmit={handleSaveShift} className="bg-slate-950 border border-cyan-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-bold text-cyan-300 text-xs flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-cyan-400" />
                  <span>{editingShift ? t.editShift : t.addNewShift}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingShift(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftName} *</label>
                  <input
                    type="text"
                    required
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="مثال: الوردية الصباحية الميدانية"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftCode}</label>
                  <input
                    type="text"
                    value={shiftCode}
                    onChange={(e) => setShiftCode(e.target.value)}
                    placeholder="SHIFT-01"
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftType}</label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white"
                  >
                    <option value="MORNING">{t.shiftMorning}</option>
                    <option value="EVENING">{t.shiftEvening}</option>
                    <option value="NIGHT">{t.shiftNight}</option>
                    <option value="CUSTOM">{t.shiftCustom}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftGracePeriod}</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftStartTime} *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.shiftEndTime} *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultShift"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-cyan-500 bg-slate-900 border-white/10"
                />
                <label htmlFor="isDefaultShift" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  تعيين كوردية افتراضية لجميع الموظفين الجدد
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  حفظ الوردية
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            يتم تطبيق جدول الوردية فوراً لحساب التأخيرات والإضافي
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
