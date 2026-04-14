import { useState } from 'react'

type Screen = 'ASN_INPUT' | 'SKU_LIST' | 'DETAIL'

interface SKU {
  id: string
  name: string
  barcode?: string
  expectedQty: number
  receivedQty: number
  defects: { reason: string; qty: number }[]
}

const MOCK_SKUS: SKU[] = [
  { id: '1', name: 'Standard T-Shirt L', barcode: '8801234567890', expectedQty: 10, receivedQty: 0, defects: [] },
  { id: '2', name: 'Premium Jeans 32', barcode: '8801234567891', expectedQty: 5, receivedQty: 0, defects: [] },
  { id: '3', name: 'Basic Socks White', expectedQty: 20, receivedQty: 0, defects: [] },
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('ASN_INPUT')
  const [asn, setAsn] = useState('')
  const [skus, setSkus] = useState<SKU[]>(MOCK_SKUS)
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)

  const selectedSku = skus.find(s => s.id === selectedSkuId)

  const renderScreen = () => {
    switch (screen) {
      case 'ASN_INPUT':
        return (
          <div className="p-4 flex flex-col gap-4">
            <h1 className="text-xl font-bold">ASN Inspection</h1>
            <input
              type="text"
              placeholder="Scan or Enter ASN"
              className="border p-4 text-lg rounded"
              value={asn}
              onChange={(e) => setAsn(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => asn && setScreen('SKU_LIST')}
              className="bg-blue-600 text-white p-4 rounded-lg text-xl font-bold"
            >
              Start Inspection
            </button>
          </div>
        )
      case 'SKU_LIST':
        return (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setScreen('ASN_INPUT')} className="p-2 border rounded">Back</button>
              <h1 className="text-xl font-bold">SKU List ({asn})</h1>
            </div>
            <input
              type="text"
              placeholder="Scan SKU Barcode"
              className="border p-4 text-lg rounded"
              autoFocus
            />
            <div className="flex flex-col gap-2">
              {skus.map(sku => (
                <button
                  key={sku.id}
                  onClick={() => {
                    setSelectedSkuId(sku.id)
                    setScreen('DETAIL')
                  }}
                  className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm active:bg-gray-100"
                >
                  <div className="text-left">
                    <div className="font-bold">{sku.name}</div>
                    <div className="text-sm text-gray-500">{sku.barcode || 'No Barcode'}</div>
                  </div>
                  <div className="text-lg font-bold">
                    {sku.receivedQty} / {sku.expectedQty}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      case 'DETAIL':
        if (!selectedSku) return null
        return (
          <div className="p-4 flex flex-col gap-4">
             <div className="flex items-center gap-2">
              <button onClick={() => setScreen('SKU_LIST')} className="p-2 border rounded">Back</button>
              <h1 className="text-xl font-bold">Inspection Detail</h1>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="font-bold text-lg">{selectedSku.name}</div>
              <div className="text-gray-500">{selectedSku.barcode || 'No Barcode'}</div>
            </div>

            <div className="flex flex-col gap-2">
               <label className="font-bold">Quantity Input</label>
               <div className="flex items-center gap-4 justify-center">
                  <button 
                    className="w-16 h-16 bg-gray-200 rounded-full text-3xl"
                    onClick={() => {
                      const newSkus = skus.map(s => s.id === selectedSku.id ? { ...s, receivedQty: Math.max(0, s.receivedQty - 1) } : s)
                      setSkus(newSkus)
                    }}
                  >-</button>
                  <input 
                    type="number"
                    className="w-24 text-center text-3xl border-b-2 border-blue-600 outline-none"
                    value={selectedSku.receivedQty}
                    onChange={(e) => {
                       const val = parseInt(e.target.value) || 0
                       const newSkus = skus.map(s => s.id === selectedSku.id ? { ...s, receivedQty: val } : s)
                       setSkus(newSkus)
                    }}
                  />
                  <button 
                    className="w-16 h-16 bg-gray-200 rounded-full text-3xl"
                    onClick={() => {
                      const newSkus = skus.map(s => s.id === selectedSku.id ? { ...s, receivedQty: s.receivedQty + 1 } : s)
                      setSkus(newSkus)
                    }}
                  >+</button>
               </div>
            </div>

            <button 
              className="bg-red-100 text-red-600 p-4 rounded-lg font-bold border border-red-200"
              onClick={() => {
                const reason = prompt('Enter defect reason:')
                if (reason) {
                   const newSkus = skus.map(s => {
                     if (s.id === selectedSku.id) {
                       const existing = s.defects.find(d => d.reason === reason)
                       if (existing) {
                         return { ...s, defects: s.defects.map(d => d.reason === reason ? { ...d, qty: d.qty + 1 } : d) }
                       } else {
                         return { ...s, defects: [...s.defects, { reason, qty: 1 }] }
                       }
                     }
                     return s
                   })
                   setSkus(newSkus)
                }
              }}
            >
              + Add Defect
            </button>

            {selectedSku.defects.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedSku.defects.map((d, i) => (
                  <div key={i} className="flex justify-between p-2 bg-red-50 text-red-700 rounded border border-red-100">
                    <span>{d.reason}</span>
                    <span className="font-bold">{d.qty}</span>
                  </div>
                ))}
              </div>
            )}

            <button 
              className="mt-4 bg-green-600 text-white p-4 rounded-lg text-xl font-bold"
              onClick={() => {
                const randomBarcode = selectedSku.barcode || Math.random().toString(36).substring(2, 12).toUpperCase()
                alert(`Generate & Print Barcode\n\nBarcode: ${randomBarcode}\nQuantity: ${selectedSku.receivedQty}`)
              }}
            >
              Generate & Print Barcode
            </button>
          </div>
        )
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[360px] bg-white shadow-xl min-h-screen">
        {renderScreen()}
      </div>
    </div>
  )
}
