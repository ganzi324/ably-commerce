import { useState } from 'react'
import { ArrowLeft, X, Image as ImageIcon, Check, Barcode } from 'lucide-react'

type Screen = 'ASN_INPUT' | 'SKU_LIST' | 'DETAIL'
type Mode = 'Standard' | 'Basic'
type Status = '대기' | '진행중' | '완료'

interface Defect {
  id: string
  reason: string
  qty: number
}

interface SKU {
  id: string
  code: string
  name: string
  option: string
  barcode?: string
  expectedQty: number
  receivedQty: number
  defects: Defect[]
  status: Status
}

const MOCK_SKUS: SKU[] = [
  { id: '1', code: 'S-TEE-BLK-L', name: '스탠다드 티셔츠', option: 'Black / L', barcode: '8801234567890', expectedQty: 10, receivedQty: 0, defects: [], status: '대기' },
  { id: '2', code: 'P-JEAN-32', name: '프리미엄 청바지', option: 'Denim / 32', barcode: '8801234567891', expectedQty: 5, receivedQty: 2, defects: [], status: '진행중' },
  { id: '3', code: 'B-SOCK-WHT', name: '베이직 양말', option: 'White / Free', expectedQty: 20, receivedQty: 20, defects: [], status: '완료' },
]

const DEFECT_REASONS = ['파손', '오염', '사이즈 오류', '색상 불량', '봉제 불량']

export default function App() {
  const [screen, setScreen] = useState<Screen>('ASN_INPUT')
  const [mode] = useState<Mode>('Standard')
  const [asn, setAsn] = useState('')
  const [skus, setSkus] = useState<SKU[]>(MOCK_SKUS)
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(true)
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false)
  const [isCompletePopupOpen, setIsCompletePopupOpen] = useState(false)
  const [isPrintPopupOpen, setIsPrintPopupOpen] = useState(false)
  const [printQty, setPrintQty] = useState(0)
  const [isQtyAlertOpen, setIsQtyAlertOpen] = useState(false)

  const selectedSku = skus.find(s => s.id === selectedSkuId)
  
  const totalExpected = skus.reduce((acc, s) => acc + s.expectedQty, 0)
  const totalReceived = skus.reduce((acc, s) => acc + s.receivedQty + s.defects.reduce((dAcc, d) => dAcc + d.qty, 0), 0)
  const progressPercent = Math.round((totalReceived / totalExpected) * 100) || 0

  const validateAndSetQty = (skuId: string, newReceivedQty: number, newDefects?: Defect[]) => {
    const sku = skus.find(s => s.id === skuId)
    if (!sku) return false
    
    const defects = newDefects || sku.defects
    const currentTotalDefects = defects.reduce((acc, d) => acc + d.qty, 0)
    
    if (newReceivedQty + currentTotalDefects > sku.expectedQty) {
      setIsQtyAlertOpen(true)
      return false
    }
    
    setSkus(skus.map(s => s.id === skuId ? { ...s, receivedQty: newReceivedQty, defects: defects } : s))
    return true
  }

  const handleDefectAdd = (reason: string) => {
    if (!selectedSku) return
    const existing = selectedSku.defects.find(d => d.reason === reason)
    let newDefects: Defect[]
    if (existing) {
      newDefects = selectedSku.defects.map(d => d.reason === reason ? { ...d, qty: d.qty + 1 } : d)
    } else {
      newDefects = [...selectedSku.defects, { id: Math.random().toString(), reason, qty: 1 }]
    }
    validateAndSetQty(selectedSku.id, selectedSku.receivedQty, newDefects)
    setIsDefectModalOpen(false)
  }

  const updateDefectQty = (skuId: string, defectId: string, delta: number) => {
    const sku = skus.find(s => s.id === skuId)
    if (!sku) return
    const newDefects = sku.defects.map(d => d.id === defectId ? { ...d, qty: Math.max(1, d.qty + delta) } : d)
    validateAndSetQty(skuId, sku.receivedQty, newDefects)
  }

  const deleteDefect = (skuId: string, defectId: string) => {
    setSkus(skus.map(s => {
      if (s.id === skuId) {
        return { ...s, defects: s.defects.filter(d => d.id !== defectId) }
      }
      return s
    }))
  }

  const completeSku = () => {
    if (!selectedSku) return
    setSkus(skus.map(s => s.id === selectedSku.id ? { ...s, status: '완료' as Status } : s))
    setIsCompletePopupOpen(false)
    setScreen('SKU_LIST')
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const renderHeader = (title: string, showBack = true, showWms = false) => (
    <header className="bg-black text-white px-3 py-2 flex flex-col gap-0.5 shadow-md shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => setScreen(screen === 'DETAIL' ? 'SKU_LIST' : 'ASN_INPUT')} className="p-1">
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-lg leading-tight">{title}</span>
            {showWms && <span className="text-[10px] text-gray-400 font-bold tracking-wider">ABLY WMS</span>}
          </div>
          {(screen === 'SKU_LIST' || screen === 'DETAIL') && (
            <span className="bg-blue-600 text-[11px] px-2 py-0.5 rounded-full font-bold ml-1">
              {mode}
            </span>
          )}
        </div>
        {(screen === 'SKU_LIST' || screen === 'DETAIL') && (
          <input
            type="text"
            placeholder="바코드"
            className="bg-gray-800 text-white text-[11px] p-1.5 rounded w-16 outline-none border border-gray-700"
          />
        )}
      </div>
      {screen === 'SKU_LIST' && (
        <div className="text-sm text-gray-400 ml-1 font-bold">ASN: {asn}</div>
      )}
    </header>
  )

  const renderScreen = () => {
    switch (screen) {
      case 'ASN_INPUT':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {renderHeader('ASN 입고', false, true)}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center">
              <div className="bg-gray-100 p-4 rounded-full text-gray-400 mb-2">
                <Barcode size={48} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xl font-bold">입고번호 입력</div>
                <div className="text-sm text-gray-500">바코드를 스캔하거나 직접 입력하세요.</div>
              </div>
              <div className="w-full flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="ASN-2026-04-001"
                  className="border border-gray-300 p-3 text-center text-base rounded-lg focus:border-blue-600 outline-none w-full shadow-inner"
                  value={asn}
                  onChange={(e) => setAsn(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => asn && setScreen('SKU_LIST')}
                  className="bg-gray-500 text-white p-3 rounded-lg text-lg font-bold shadow active:bg-gray-600 transition-colors w-full"
                >
                  검수 시작
                </button>
              </div>
            </div>
          </div>
        )
      case 'SKU_LIST':
        return (
          <div className="flex flex-col h-screen overflow-hidden">
            {renderHeader('상품 목록')}
            
            {/* Progress Section */}
            <div className="bg-gray-100 p-2 border-b border-gray-200 shrink-0">
              <div className="flex justify-between text-base font-bold mb-1">
                <span>전체 진행률</span>
                <span className="text-blue-600">{totalReceived}/{totalExpected} ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-gray-300 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* SKU Items List */}
            <div className="flex-1 overflow-y-auto bg-white">
              {skus.map(sku => (
                <button
                  key={sku.id}
                  onClick={() => {
                    setSelectedSkuId(sku.id)
                    setScreen('DETAIL')
                  }}
                  className="w-full border-b border-gray-100 p-3 flex flex-col gap-0.5 text-left active:bg-gray-50"
                >
                  <div className="text-xs text-blue-600 font-bold">{sku.code}</div>
                  <div className="font-bold text-lg truncate leading-tight">{sku.name}</div>
                  <div className="text-base text-gray-500">{sku.option}</div>
                  <div className="flex justify-between items-center mt-1.5">
                    <div className="text-lg font-bold">
                      {sku.receivedQty + sku.defects.reduce((acc, d) => acc + d.qty, 0)}/{sku.expectedQty}
                    </div>
                    <div className={`text-base px-2.5 py-0.5 rounded font-bold ${
                      sku.status === '완료' ? 'bg-green-100 text-green-700' :
                      sku.status === '진행중' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sku.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2 bg-white border-t border-gray-200 shrink-0">
              <button className="w-full bg-black text-white p-3 rounded-lg font-bold text-lg shadow active:bg-gray-900">
                검수 완료
              </button>
            </div>
          </div>
        )
      case 'DETAIL':
        if (!selectedSku) return null
        const totalDefects = selectedSku.defects.reduce((acc, d) => acc + d.qty, 0)
        const currentProgressQty = selectedSku.receivedQty + totalDefects
        
        return (
          <div className="flex flex-col h-screen overflow-hidden">
            {renderHeader('상품 검수')}
            
            {/* Product Info Summary */}
            <div className="bg-gray-50 p-2.5 border-b border-gray-200 flex flex-col gap-0.5 shrink-0">
              <div className="text-xs text-blue-600 font-bold">{selectedSku.code}</div>
              <div className="font-bold text-lg leading-tight">{selectedSku.name}</div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-500">{selectedSku.option}</span>
                <span className="font-bold text-xl text-blue-600">진행: {currentProgressQty}/{selectedSku.expectedQty}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-3">
              {/* Image Toggle Section */}
              <div className="flex flex-col gap-1">
                {showImage ? (
                  <div className="relative">
                    <div 
                      className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border border-gray-200"
                      onClick={() => setShowImage(false)}
                    >
                      <img 
                        src={`https://placehold.co/400x400/eeeeee/666666?text=${selectedSku.name}`} 
                        alt="Product"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowImage(true)}
                    className="flex items-center justify-center gap-2 p-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 border border-gray-200"
                  >
                    <ImageIcon size={14} /> 상품 이미지 보기
                  </button>
                )}
              </div>

              {/* Normal Quantity Section */}
              <div className="flex flex-col gap-1.5 overflow-hidden">
                <div className="text-sm font-bold">정상 수량</div>
                <div className="flex items-center gap-1.5">
                  <button 
                    className="w-11 h-11 bg-gray-50 rounded-lg text-2xl font-bold flex items-center justify-center border border-gray-200 active:bg-gray-200 shrink-0"
                    onClick={() => {
                      validateAndSetQty(selectedSku.id, Math.max(0, selectedSku.receivedQty - 1))
                    }}
                  >-</button>
                  <input 
                    type="number"
                    className="flex-1 min-w-0 h-11 text-center text-3xl font-bold bg-white border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    value={selectedSku.receivedQty}
                    onFocus={handleInputFocus}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      validateAndSetQty(selectedSku.id, val)
                    }}
                  />
                  <button 
                    className="w-11 h-11 bg-gray-50 rounded-lg text-2xl font-bold flex items-center justify-center border border-gray-200 active:bg-gray-200 shrink-0"
                    onClick={() => {
                      validateAndSetQty(selectedSku.id, selectedSku.receivedQty + 1)
                    }}
                  >+</button>
                </div>
              </div>

              {/* Defect Quantity Section */}
              <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center">
                  <div className="text-xs font-bold">결함 수량</div>
                  <div className="text-[11px] font-bold text-red-600">총 {totalDefects}개</div>
                </div>
                
                <button 
                  onClick={() => setIsDefectModalOpen(true)}
                  className="w-full p-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs border border-red-100 flex items-center justify-center gap-1 active:bg-red-100"
                >
                  + 결함 추가
                </button>

                {selectedSku.defects.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {selectedSku.defects.map((d) => (
                      <div key={d.id} className="bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-between shadow-sm">
                        <span className="font-bold text-[11px] text-gray-700 truncate flex-1 mr-2">{d.reason}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            className="w-8 h-8 bg-gray-50 rounded text-lg font-bold border border-gray-200 active:bg-gray-200 flex items-center justify-center"
                            onClick={() => updateDefectQty(selectedSku.id, d.id, -1)}
                          >-</button>
                          <input 
                            type="number"
                            className="w-12 h-8 text-center text-sm font-bold border border-gray-300 rounded focus:border-blue-500 outline-none"
                            value={d.qty}
                            onFocus={handleInputFocus}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              const newDefects = selectedSku.defects.map(def => def.id === d.id ? { ...def, qty: val } : def)
                              validateAndSetQty(selectedSku.id, selectedSku.receivedQty, newDefects)
                            }}
                          />
                          <button 
                            className="w-8 h-8 bg-gray-50 rounded text-lg font-bold border border-gray-200 active:bg-gray-200 flex items-center justify-center"
                            onClick={() => updateDefectQty(selectedSku.id, d.id, 1)}
                          >+</button>
                          <button 
                            onClick={() => deleteDefect(selectedSku.id, d.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 bg-gray-100 rounded active:bg-gray-200 ml-0.5"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {mode === 'Standard' && (
                <button 
                  className="mt-1 bg-green-50 text-green-700 p-2 rounded-lg font-bold text-xs border border-green-200 active:bg-green-100 shadow-sm"
                  onClick={() => {
                    setPrintQty(selectedSku.receivedQty)
                    setIsPrintPopupOpen(true)
                  }}
                >
                  바코드 생성 및 라벨 출력
                </button>
              )}
            </div>

            <div className="p-2 bg-white border-t border-gray-200 shrink-0">
              <button 
                onClick={() => setIsCompletePopupOpen(true)}
                className="w-full bg-black text-white p-3 rounded-lg font-bold text-base shadow active:bg-gray-900"
              >
                SKU 검수완료
              </button>
            </div>

            {/* Modals & Popups */}
            {isQtyAlertOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-2xl p-5 w-full max-w-[240px] flex flex-col gap-4 shadow-2xl text-center">
                  <div className="flex flex-col gap-2 text-red-600">
                    <X size={48} className="mx-auto" />
                    <h2 className="text-lg font-bold">수량 초과</h2>
                    <p className="text-gray-500 text-xs leading-relaxed">입고 예정 수량을 초과할 수 없습니다.</p>
                  </div>
                  <button onClick={() => setIsQtyAlertOpen(false)} className="w-full p-2 bg-blue-600 text-white rounded-xl font-bold active:bg-blue-700 text-sm">확인</button>
                </div>
              </div>
            )}

            {isDefectModalOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl w-full max-w-[240px] overflow-hidden shadow-2xl">
                  <div className="bg-gray-50 p-2.5 border-b font-bold text-center text-sm">결함 사유 선택</div>
                  <div className="flex flex-col">
                    {DEFECT_REASONS.map(reason => (
                      <button 
                        key={reason}
                        onClick={() => handleDefectAdd(reason)}
                        className="p-3 border-b border-gray-50 last:border-0 text-left active:bg-gray-100 font-medium text-xs"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setIsDefectModalOpen(false)} className="w-full p-3 text-gray-400 font-bold border-t active:bg-gray-50 text-xs">취소</button>
                </div>
              </div>
            )}

            {isCompletePopupOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-5 w-full max-w-[240px] flex flex-col gap-4 shadow-2xl text-center">
                  <div className="flex flex-col gap-1.5">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-1">
                      <Check size={24} />
                    </div>
                    <h2 className="text-lg font-bold">검수 완료</h2>
                    <p className="text-gray-500 text-xs leading-relaxed">해당 상품의 검수를<br/>완료 처리하시겠습니까?</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsCompletePopupOpen(false)} className="flex-1 p-2 bg-gray-100 rounded-xl font-bold active:bg-gray-200 text-gray-700 text-sm">닫기</button>
                    <button onClick={completeSku} className="flex-1 p-2 bg-blue-600 text-white rounded-xl font-bold active:bg-blue-700 text-sm">확인</button>
                  </div>
                </div>
              </div>
            )}

            {isPrintPopupOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl p-5 w-full max-w-[240px] flex flex-col gap-3 shadow-2xl">
                  <h2 className="text-lg font-bold text-center">라벨 출력</h2>
                  <div className="border-2 border-dashed border-gray-300 p-3 flex flex-col items-center gap-2 rounded-xl bg-white">
                    <div className="w-full flex items-center justify-center text-black font-mono text-[8px] tracking-widest overflow-hidden whitespace-nowrap">
                      || |||| ||| || |||| || |||| ||| || |||| || |||| ||| || ||||
                    </div>
                    <div className="font-mono text-[10px] font-bold text-black">{selectedSku.barcode || 'NEW-12345678'}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-gray-400 text-center uppercase">출력 수량</label>
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => setPrintQty(Math.max(1, printQty - 1))} className="w-7 h-7 bg-gray-100 rounded-full font-bold border active:bg-gray-200">-</button>
                      <input type="number" className="w-12 text-center text-lg font-bold outline-none" value={printQty} onFocus={handleInputFocus} onChange={(e) => setPrintQty(parseInt(e.target.value) || 0)} />
                      <button onClick={() => setPrintQty(printQty + 1)} className="w-8 h-8 bg-gray-100 rounded-full font-bold border active:bg-gray-200">+</button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setIsPrintPopupOpen(false)} className="flex-1 p-2.5 bg-gray-100 rounded-xl font-bold text-sm active:bg-gray-200">취소</button>
                    <button onClick={() => setIsPrintPopupOpen(false)} className="flex-1 p-2.5 bg-black text-white rounded-xl font-bold text-sm active:bg-gray-900">출력</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="w-full h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-[360px] bg-white shadow-2xl h-screen flex flex-col">
        {renderScreen()}
      </div>
    </div>
  )
}
