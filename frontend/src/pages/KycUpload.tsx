import { useState, useEffect } from 'react';
import { getKycDocuments, uploadKycDocument } from '../api/newFeaturesService';

const DOC_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: '🪪' },
  { value: 'PAN', label: 'PAN Card', icon: '💳' },
  { value: 'PASSPORT', label: 'Passport', icon: '📘' },
  { value: 'DRIVING_LICENSE', label: "Driver's License", icon: '🚗' },
  { value: 'VOTER_ID', label: 'Voter ID', icon: '🗳️' },
];

const statusStyle: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50 border-amber-200',
  APPROVED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  REJECTED: 'text-red-600 bg-red-50 border-red-200',
};

export default function KycUpload() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('AADHAAR');
  const [file, setFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [drag, setDrag] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDocs = () => {
    setLoading(true);
    getKycDocuments().then(r => setDocs(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async () => {
    if (!file) return showToast('Please select a file first', false);
    setUploading(true);
    try {
      await uploadKycDocument(file, selectedType);
      showToast('Document uploaded! Pending admin verification.', true);
      setFile(null);
      loadDocs();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Upload failed', false);
    } finally { setUploading(false); }
  };

  const uploadedTypes = new Set(docs.map((d: any) => d.documentType));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">🔍</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">KYC Verification</h1>
          <p className="text-sm text-slate-500">Upload identity documents to verify your account</p>
        </div>
      </div>

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${toast.ok ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Status row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {DOC_TYPES.map(dt => {
          const doc = docs.find((d: any) => d.documentType === dt.value);
          return (
            <div key={dt.value} className={`rounded-xl border p-2 text-center ${doc ? statusStyle[doc.verificationStatus] : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <div className="text-xl mb-0.5">{dt.icon}</div>
              <div className="text-xs font-semibold leading-tight">{dt.label}</div>
              <div className="text-xs mt-0.5">{doc ? doc.verificationStatus : 'Not uploaded'}</div>
            </div>
          );
        })}
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-800">Upload Document</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOC_TYPES.map(dt => (
            <button key={dt.value} type="button" onClick={() => setSelectedType(dt.value)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${selectedType === dt.value ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400' : 'border-slate-200 hover:border-slate-300'}`}>
              <span className="text-xl">{dt.icon}</span>
              <div>
                <div className="text-xs font-medium text-slate-800">{dt.label}</div>
                {uploadedTypes.has(dt.value) && <div className="text-xs text-emerald-600">✓ Uploaded</div>}
              </div>
            </button>
          ))}
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          onClick={() => document.getElementById('kyc-file-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${drag ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
          <input id="kyc-file-input" type="file" className="hidden" accept="image/*,application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">☁️</div>
              <p className="text-sm font-medium text-slate-600">Drag & drop or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, PDF — max 5MB</p>
            </div>
          )}
        </div>

        <button id="kyc-upload-btn" onClick={handleUpload} disabled={!file || uploading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
          {uploading ? 'Uploading…' : `Upload ${DOC_TYPES.find(t => t.value === selectedType)?.label}`}
        </button>
      </div>

      {/* Docs list */}
      {!loading && docs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Uploaded Documents</h3>
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{DOC_TYPES.find(t => t.value === doc.documentType)?.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{doc.documentType.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">{doc.fileName}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${statusStyle[doc.verificationStatus]}`}>
                  {doc.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
