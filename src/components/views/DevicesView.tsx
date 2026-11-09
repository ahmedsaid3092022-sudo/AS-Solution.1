import React, { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Plus, Trash2, CheckCircle2, XCircle, HardDrive } from 'lucide-react';
import { BiometricDevice } from '../../types';
import { deviceService } from '../../services/deviceService';
import { Badge } from '../common/Badge';

export const DevicesView: React.FC = () => {
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [ipAddress, setIpAddress] = useState('192.168.1.205');
  const [port, setPort] = useState(4370);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('مدخل المكتب الإداري');
  const [model, setModel] = useState('ZKTeco SpeedFace');

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const loadDevices = () => {
    setDevices(deviceService.getDevices());
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('يرجى كتابة اسم الجهاز');

    deviceService.addDevice({
      name,
      ipAddress,
      port: Number(port),
      location,
      model,
    });

    setName('');
    loadDevices();
  };

  const handleSync = async (deviceId: string) => {
    setLoadingMap((prev) => ({ ...prev, [deviceId]: true }));
    try {
      const res = await deviceService.syncDeviceLogs(deviceId);
      alert(res.message);
      loadDevices();
    } catch (e: any) {
      alert(`فشل المزامنة: ${e?.message || e}`);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleDelete = (id: string, devName: string) => {
    if (confirm(`هل أنت تأكد من إزالة الجهاز (${devName})؟`)) {
      deviceService.deleteDevice(id);
      loadDevices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">أجهزة البصمة المسجلة في الشبكة</h3>
                <p className="text-xs text-slate-400">الربط المباشر مع بروتوكولات ZKTeco, Hikvision, Dahua SDK</p>
              </div>
              <Badge variant="blue">{devices.length} أجهزة متصلة</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{dev.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {dev.ipAddress}:{dev.port} | {dev.location}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        آخر مزامنة: {new Date(dev.lastSync).toLocaleString('ar-EG')} (سجلات: {dev.totalLogs})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {dev.status === 'ONLINE' ? (
                      <Badge variant="emerald">متصل متجاوب</Badge>
                    ) : (
                      <Badge variant="red">غير متصل</Badge>
                    )}

                    <button
                      onClick={() => handleSync(dev.id)}
                      disabled={loadingMap[dev.id]}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-500/20 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingMap[dev.id] ? 'animate-spin' : ''}`} />
                      <span>سحب الحضور</span>
                    </button>

                    <button
                      onClick={() => handleDelete(dev.id, dev.name)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add New Device Form */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">إضافة جهاز بصمة جديد</h3>
            <p className="text-xs text-slate-400">إدخال عناوين IP والتكوين الشبكي للربط السلس</p>
          </div>

          <form onSubmit={handleAddDevice} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-300">اسم الجهاز / المسمى</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: جهاز مدخل الإدارة الرئيسية"
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">عنوان IP الجهاز</label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">منفذ الاتصال (Port)</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">الموقع الجغرافي / المبنى</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-300">موديل المصنع / البروتوكول</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ZKTeco SpeedFace" className="bg-slate-900 text-white">ZKTeco SpeedFace (بصمة وجه وكف)</option>
                <option value="ZKTeco K40 Fingerprint" className="bg-slate-900 text-white">ZKTeco K40 (بصمة أصبع وكارت)</option>
                <option value="Hikvision DS-K1T" className="bg-slate-900 text-white">Hikvision Terminal (Face Recognition)</option>
                <option value="Dahua Standalone" className="bg-slate-900 text-white">Dahua Fingerprint Access</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ وإضافة الجهاز</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
