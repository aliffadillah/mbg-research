import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { detectionApi } from '../../shared/lib/apiClient';

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) return;
    setResult(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 95) { clearInterval(interval); return 95; } return p + Math.random() * 15; });
    }, 200);

    const { data, error } = await detectionApi.analyze(file);
    
    clearInterval(interval); 
    setProgress(100);

    setTimeout(() => {
      if (data && data.success) {
        setResult(data);
      } else {
        alert(error || 'Gagal menganalisis gambar');
        setResult(null);
      }
      setLoading(false);
    }, 500);
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProgress(0);
  };

  const foods = Array.isArray(result?.foods) ? result.foods : [];
  const totalCalories = result?.total_nutrition?.calories ?? 0;
  const processingTime = result?.processing_time_s ?? null;
  const showNutrition = foods.length > 0;
  // overlay_image is a base64 data URL string from the Python API
  const overlayImage = result?.overlay_image || null;

  return (
    <div className="space-y-6">
      {!preview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative bg-white rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            dragOver ? 'border-[#4361ee] bg-[#4361ee]/5' : 'border-gray-200 hover:border-gray-300'
          }`}>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <p className="text-sm text-gray-600 font-medium">Drop images, videos, or datasets</p>
          <p className="text-xs text-gray-400 mt-1">Images ≤10 MB · JPG, PNG, WebP</p>
        </div>
      )}

      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Preview</span>
                {overlayImage && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                    AI Overlay
                  </span>
                )}
              </div>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Ganti</button>
            </div>
            <div className="relative bg-gray-900">
              <img
                src={overlayImage ?? preview}
                alt="Detection preview"
                className="w-full h-auto block"
                style={{ maxHeight: '70vh', objectFit: 'contain', margin: '0 auto' }}
              />
              {loading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-[#4361ee] rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-sm text-gray-700 font-medium">Menganalisis...</div>
                    <div className="w-40 h-1.5 bg-gray-200 rounded-full mt-2 mx-auto overflow-hidden">
                      <motion.div className="h-full bg-[#4361ee] rounded-full" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{Math.round(progress)}%</div>
                  </div>
                </div>
              )}
            </div>
            {!loading && !result && (
              <div className="p-4">
                <button onClick={handleAnalyze} className="w-full py-2 bg-[#4361ee] text-white rounded-md text-sm font-medium hover:bg-[#3a56d4] transition-colors">Analisis Makanan</button>
              </div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {result ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Hasil Deteksi</span>
                  <span className="text-[10px] text-gray-400">
                    {processingTime != null ? `${processingTime}s` : '-'}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="text-center py-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{totalCalories}</div>
                    <div className="text-[11px] text-gray-400">Total Kalori (kkal)</div>
                  </div>

                  {/* Table */}
                  <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider grid grid-cols-12 gap-1 px-2 pb-1 border-b border-gray-100">
                    <div className="col-span-4">Makanan</div>
                    <div className="col-span-2 text-right">Kalori</div>
                    <div className="col-span-2 text-right">Protein</div>
                    <div className="col-span-2 text-right">Lemak</div>
                    <div className="col-span-2 text-right">Akurasi</div>
                  </div>
                  {foods.map((food: any, i: number) => (
                    <motion.div key={`${food.label}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className="grid grid-cols-12 gap-1 px-2 py-1.5 text-[13px] hover:bg-gray-50 rounded transition-colors">
                      <div className="col-span-4">
                        <div className="font-medium text-gray-900 truncate">{food.label}</div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-gray-500">
                          <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded">
                            Porsi {((food.portion_ratio || 0) * 100).toFixed(1)}%
                          </span>
                          <span className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded">
                            {food.estimated_weight_g != null ? `${food.estimated_weight_g}g` : food.area_source || 'n/a'}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2 text-right text-gray-700">{food.nutrition?.calories ?? '-'}</div>
                      <div className="col-span-2 text-right text-gray-500">
                        {food.nutrition?.protein != null ? `${food.nutrition.protein}g` : '-'}
                      </div>
                      <div className="col-span-2 text-right text-gray-500">
                        {food.nutrition?.fat != null ? `${food.nutrition.fat}g` : '-'}
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                          {typeof food.confidence === 'number' ? `${(food.confidence * 100).toFixed(0)}%` : '-'}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Total Nutrition Summary */}
                  {result.total_nutrition && (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-xs font-bold text-blue-700">{result.total_nutrition.calories}</div>
                        <div className="text-[9px] text-blue-500">Kalori</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-xs font-bold text-green-700">{result.total_nutrition.protein}g</div>
                        <div className="text-[9px] text-green-500">Protein</div>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded-lg">
                        <div className="text-xs font-bold text-amber-700">{result.total_nutrition.fat}g</div>
                        <div className="text-[9px] text-amber-500">Lemak</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <div className="text-xs font-bold text-purple-700">{result.total_nutrition.carbs}g</div>
                        <div className="text-[9px] text-purple-500">Karbs</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button onClick={handleReset} className="w-full py-2 border border-gray-200 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">Scan Lagi</button>
                </div>
              </motion.div>
            ) : !loading ? (
              <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center text-center p-8">
                <div>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="text-xs text-gray-400">Klik "Analisis Makanan" untuk memulai</p>
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
