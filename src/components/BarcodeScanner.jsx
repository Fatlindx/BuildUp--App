import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Plus, AlertCircle, CheckCircle, Pencil } from 'lucide-react';
import { lookupPLU } from '../data/plu';

export default function BarcodeScanner({ onAddFood, onClose }) {
  const scannerRef = useRef(null);
  const [status, setStatus]     = useState('idle');
  const [product, setProduct]   = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manual, setManual]     = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    startScanner();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const startScanner = () => {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 160 } },
      async (code) => {
        await scanner.stop();
        setStatus('loading');
        await handleCode(code);
      },
      () => {}
    ).then(() => setStatus('scanning'))
     .catch(() => {
       setStatus('error');
       setErrorMsg('Kamera konnte nicht geöffnet werden. Bitte Kamerazugriff erlauben.');
     });
  };

  const handleCode = async (code) => {
    // Schicht 1: PLU Code? (4-5 stellig, nur Zahlen)
    const isPLU = /^\d{4,5}$/.test(code.trim());
    if (isPLU) {
      const pluProduct = lookupPLU(code);
      if (pluProduct) {
        setProduct({ ...pluProduct, source: 'PLU' });
        setStatus('found');
        return;
      }
    }

    // Schicht 2: Open Food Facts API
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        setProduct({
          name:     p.product_name || p.product_name_de || 'Unbekanntes Produkt',
          brand:    p.brands || '',
          serving:  p.serving_size || '100g',
          calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
          protein:  Math.round(n['proteins_100g']       || 0),
          carbs:    Math.round(n['carbohydrates_100g']   || 0),
          fat:      Math.round(n['fat_100g']             || 0),
          category: 'Gescannt',
          source:   'OpenFoodFacts',
        });
        setStatus('found');
        return;
      }
    } catch {}

    // Schicht 3: PLU nochmal versuchen (auch wenn kein reiner PLU)
    const pluFallback = lookupPLU(code);
    if (pluFallback) {
      setProduct({ ...pluFallback, source: 'PLU' });
      setStatus('found');
      return;
    }

    // Nichts gefunden → manuelle Eingabe
    setStatus('notfound');
  };

  const handleAdd = () => {
    if (!product) return;
    onAddFood({
      id:       Date.now(),
      name:     product.brand ? `${product.name} (${product.brand})` : product.name,
      category: product.category || 'Gescannt',
      serving:  product.serving || '100g',
      calories: product.calories,
      protein:  product.protein,
      carbs:    product.carbs,
      fat:      product.fat,
    });
    onClose();
  };

  const handleManualAdd = () => {
    if (!manual.name || !manual.calories) return;
    onAddFood({
      id:       Date.now(),
      name:     manual.name,
      category: 'Manuell',
      serving:  '100g',
      calories: parseInt(manual.calories) || 0,
      protein:  parseInt(manual.protein)  || 0,
      carbs:    parseInt(manual.carbs)    || 0,
      fat:      parseInt(manual.fat)      || 0,
    });
    onClose();
  };

  const handleRescan = () => {
    setProduct(null);
    setStatus('idle');
    setErrorMsg('');
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setTimeout(() => startScanner(), 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-inner">
            <Camera size={20} color="var(--green)" />
            <div>
              <h2 className="modal-title">Barcode scannen</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Barcode, QR-Code oder PLU-Code scannen
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">

          {/* Kamera */}
          {(status === 'idle' || status === 'scanning') && (
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div id="barcode-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }} />
              {status === 'scanning' && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid var(--green)', borderRadius: 8,
                  width: 260, height: 120, pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)'
                }} />
              )}
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => setStatus('manual')}
                  style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Pencil size={13} /> Nährwerte manuell eingeben
                </button>
              </div>
            </div>
          )}

          {/* Laden */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Produktdaten werden geladen...</p>
            </div>
          )}

          {/* Produkt gefunden */}
          {status === 'found' && product && (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                padding: '12px 16px', background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10
              }}>
                <CheckCircle size={18} color="var(--green)" />
                <span style={{ fontSize: 13.5, color: 'var(--green)', fontWeight: 600 }}>
                  {product.source === 'PLU' ? '🥦 Obst/Gemüse erkannt!' : '✅ Produkt gefunden!'}
                </span>
                {product.isBio && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    background: 'rgba(34,197,94,0.15)', color: 'var(--green)',
                    padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(34,197,94,0.3)'
                  }}>🌱 Bio</span>
                )}
              </div>

              <div style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 20, marginBottom: 20
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{product.name}</div>
                {product.brand && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>{product.brand}</div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Kalorien',      value: `${product.calories} kcal`, color: 'var(--green)' },
                    { label: 'Protein',        value: `${product.protein}g`,      color: '#ef4444' },
                    { label: 'Kohlenhydrate',  value: `${product.carbs}g`,        color: '#f97316' },
                    { label: 'Fette',          value: `${product.fat}g`,          color: '#eab308' },
                  ].map(m => (
                    <div key={m.label} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '10px 6px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 12 }}>
                  pro {product.serving}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRescan}>
                  Erneut scannen
                </button>
                <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}
                  onClick={handleAdd}>
                  <Plus size={15} /> Zum Tracker hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Produkt nicht gefunden → manuelle Eingabe */}
          {(status === 'notfound' || status === 'manual') && (
            <div>
              {status === 'notfound' && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                  padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10
                }}>
                  <AlertCircle size={18} color="#f87171" />
                  <span style={{ fontSize: 13.5, color: '#f87171', fontWeight: 600 }}>
                    Produkt nicht gefunden – bitte manuell eingeben
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Produktname *</label>
                  <input className="form-input" placeholder="z.B. Migros Bio Apfel"
                    value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Kalorien (kcal) *</label>
                    <input className="form-input" type="number" placeholder="z.B. 52"
                      value={manual.calories} onChange={e => setManual(p => ({ ...p, calories: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Protein (g)</label>
                    <input className="form-input" type="number" placeholder="z.B. 0.3"
                      value={manual.protein} onChange={e => setManual(p => ({ ...p, protein: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Kohlenhydrate (g)</label>
                    <input className="form-input" type="number" placeholder="z.B. 14"
                      value={manual.carbs} onChange={e => setManual(p => ({ ...p, carbs: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Fette (g)</label>
                    <input className="form-input" type="number" placeholder="z.B. 0.2"
                      value={manual.fat} onChange={e => setManual(p => ({ ...p, fat: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleRescan}>
                  Erneut scannen
                </button>
                <button className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={!manual.name || !manual.calories}
                  onClick={handleManualAdd}>
                  <Plus size={15} /> Hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Fehler */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <AlertCircle size={40} color="#f87171" style={{ marginBottom: 16 }} />
              <p style={{ fontWeight: 700, marginBottom: 8, color: '#f87171' }}>Fehler</p>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginBottom: 24 }}>{errorMsg}</p>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setStatus('manual')}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                <Pencil size={13} /> Manuell eingeben
              </button>
              <button className="btn btn-ghost btn-sm"
                onClick={onClose}
                style={{ width: '100%', justifyContent: 'center' }}>
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}