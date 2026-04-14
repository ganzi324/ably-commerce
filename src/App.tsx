import { useState, useEffect } from 'react'
import { ArrowLeft, X, Image as ImageIcon, Check, Barcode, Search, MoveHorizontal, MapPin } from 'lucide-react'
import { useInventoryStore, MOCK_LOCATIONS, MOCK_PRODUCTS_BY_LOC } from './store'

type Screen = 'HOME' | 'ASN_INPUT' | 'SKU_LIST' | 'DETAIL' | 'INV_LOC_INPUT' | 'INV_PROD_SELECT'
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
  const [screen, setScreen] = useState<Screen>('HOME')
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

  // Inventory Store
  const inv = useInventoryStore()
  const [locInput, setLocInput] = useState('')
  const [destInput, setDestInput] = useState('')
  const [isConfirmMoveOpen, setIsConfirmMoveOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)

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

  const handleBack = () => {
    if (screen === 'DETAIL') setScreen('SKU_LIST')
    else if (screen === 'SKU_LIST') setScreen('ASN_INPUT')
    else if (screen === 'ASN_INPUT') setScreen('HOME')
    else if (screen === 'INV_LOC_INPUT') setScreen('HOME')
    else if (screen === 'INV_PROD_SELECT') setScreen('INV_LOC_INPUT')
  }

  const renderHeader = (title: string, showBack = true, showWms = false, rightContent?: React.ReactNode) => (
    <header className="bg-black text-white px-3 py-2 flex flex-col gap-0.5 shadow-md shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={handleBack} className="p-1 -ml-1">
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
        {rightContent ? rightContent : (
          (screen === 'SKU_LIST' || screen === 'DETAIL') && (
            <input
              type="text"
              placeholder="바코드"
              className="bg-gray-800 text-white text-[11px] p-1.5 rounded w-16 outline-none border border-gray-700"
            />
          )
        )}
      </div>
      {screen === 'SKU_LIST' && (
        <div className="text-sm text-gray-400 ml-1 font-bold">ASN: {asn}</div>
      )}
    </header>
  )

  // Inventory Methods
  const handleLocationSubmit = (name: string) => {
    const loc = MOCK_LOCATIONS.find(l => l.name.toUpperCase() === name.toUpperCase())
    if (loc) {
      inv.setSourceLocation(loc)
      inv.setProducts(MOCK_PRODUCTS_BY_LOC[loc.id] || [])
      setScreen('INV_PROD_SELECT')
    } else {
      alert('유효하지 않은 로케이션입니다.')
    }
  }

  const handleDestLocationSubmit = (name: string) => {
    const loc = MOCK_LOCATIONS.find(l => l.name.toUpperCase() === name.toUpperCase())
    if (loc) {
      if (loc.id === inv.sourceLocation?.id) {
        alert('이동 전후 로케이션이 동일합니다.')
        return
      }
      inv.setDestinationLocation(loc)
      setIsConfirmMoveOpen(true)
    } else {
      alert('유효하지 않은 로케이션입니다.')
    }
  }

  const executeMove = () => {
    setIsConfirmMoveOpen(false)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      // Reset after success
      inv.setSelectedProduct(null)
      inv.setDestinationLocation(null)
      setDestInput('')
    }, 2000)
  }

  const handleProductBarcode = (barcode: string) => {
    const prod = inv.products.find(p => p.barcode === barcode)
    if (prod) {
      inv.setSelectedProduct(prod)
    }
  }

  const renderScreen = () => {
    switch (screen) {
      case 'HOME':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
            {renderHeader('WMS 홈', false, true)}
            <div className="flex-1 flex flex-col p-4 gap-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen('ASN_INPUT')}
                  className="aspect-square bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm active:bg-gray-100 transition-colors"
                >
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                    <Check size={32} />
                  </div>
                  <span className="font-bold text-gray-800">입고검수</span>
                </button>
                <button
                  onClick={() => setScreen('INV_LOC_INPUT')}
                  className="aspect-square bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm active:bg-gray-100 transition-colors"
                >
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                    <MoveHorizontal size={32} />
                  </div>
                  <span className="font-bold text-gray-800">재고이동</span>
                </button>
              </div>
            </div>
            <div className="p-4 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest pb-8">
              Logged in as: Inspector-01
            </div>
          </div>
        )
      case 'ASN_INPUT':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {renderHeader('ASN 입고', true, true)}
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
      case 'INV_LOC_INPUT':
        return (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {renderHeader('재고 이동', true, true)}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 text-center">
              <div className="bg-blue-50 p-6 rounded-full text-blue-600">
                <MapPin size={48} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold">출발 로케이션</div>
                <div className="text-sm text-gray-500">이동할 상품이 있는 로케이션을 스캔하세요.</div>
              </div>
              <div className="w-full flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="LOC-A-01"
                  className="border-2 border-gray-300 p-4 text-center text-xl font-bold rounded-xl focus:border-blue-600 outline-none w-full shadow-inner uppercase"
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLocationSubmit(locInput)}
                  autoFocus
                />
                <button
                  onClick={() => handleLocationSubmit(locInput)}
                  className="bg-blue-600 text-white p-4 rounded-xl text-lg font-bold shadow-lg active:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
                >
                  상품 조회
                </button>
                <button
                  onClick={() => inv.setIsLocationModalOpen(true, 'source')}
                  className="bg-white text-gray-600 border border-gray-300 p-3 rounded-xl text-sm font-bold active:bg-gray-50 w-full flex items-center justify-center gap-2"
                >
                  <Search size={16} /> 로케이션 찾기
                </button>
              </div>
            </div>
          </div>
        )
      case 'INV_PROD_SELECT':
        return (
          <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
            {renderHeader('재고 이동', true, false, (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="상품 바코드"
                  className="bg-gray-800 text-white text-xs p-1.5 rounded w-28 outline-none border border-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProductBarcode((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
              </div>
            ))}
            
            {/* Location Info Bar */}
            <div className="bg-blue-600 text-white p-3 shadow-inner flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span className="font-bold text-lg">{inv.sourceLocation?.name}</span>
              </div>
              <div className="flex gap-3 text-xs font-bold bg-blue-700 px-3 py-1.5 rounded-full">
                <span>SKU: {inv.sourceLocation?.itemCount}</span>
                <span>총량: {inv.sourceLocation?.totalQty}</span>
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {inv.products.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => inv.setSelectedProduct(prod)}
                  className={`bg-white border-b border-gray-100 p-3 text-left flex flex-col gap-0.5 transition-all active:bg-gray-50 ${
                    inv.selectedProduct?.id === prod.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset z-10' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-blue-600 font-bold">{prod.code}</span>
                      <span className="font-bold text-base text-gray-800 leading-tight">{prod.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      prod.status === '가용' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{prod.status}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-sm text-gray-500">{prod.option}</span>
                    <span className="text-xl font-black text-black">{prod.qty}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Bottom Action Panel */}
            <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] bg-white border-t-2 border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 z-50 ${
              inv.selectedProduct ? 'translate-y-0' : 'translate-y-full'
            }`}>
              {/* Panel Handle / Close Area */}
              <button 
                onClick={() => inv.setSelectedProduct(null)}
                className="w-full h-8 bg-gray-50 flex items-center justify-center border-b border-gray-100 active:bg-gray-100"
              >
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
                <ArrowLeft className="-rotate-90 text-gray-400 absolute right-4" size={20} />
              </button>

              <div className="p-4 pt-2 flex flex-col gap-4 relative">
                {/* Product Detail Info */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-blue-600 font-bold">{inv.selectedProduct?.code}</span>
                    <span className="font-bold text-xl text-gray-900 leading-tight">{inv.selectedProduct?.name}</span>
                    <span className="text-sm text-gray-500">{inv.selectedProduct?.option} ({inv.selectedProduct?.status})</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">현재 수량</div>
                    <div className="text-2xl font-black text-black leading-tight">{inv.selectedProduct?.qty}</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">이동 수량</label>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => inv.setMoveQty(Math.max(1, inv.moveQty - 1))}
                        className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center active:bg-gray-200"
                      >-</button>
                      <input 
                        type="number" 
                        className="flex-1 min-w-0 h-10 border border-gray-300 rounded-lg text-center font-bold text-lg outline-none focus:border-blue-500"
                        value={inv.moveQty}
                        onFocus={handleInputFocus}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          const max = inv.selectedProduct?.qty || 0
                          inv.setMoveQty(Math.min(val, max))
                        }}
                      />
                      <button 
                        onClick={() => {
                          const max = inv.selectedProduct?.qty || 0
                          inv.setMoveQty(Math.min(max, inv.moveQty + 1))
                        }}
                        className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center active:bg-gray-200"
                      >+</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">목적지 로케이션</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="스캔 / 입력"
                        className="w-full h-10 border border-gray-300 rounded-lg px-2 font-bold text-base outline-none focus:border-blue-500 uppercase pr-8"
                        value={destInput}
                        onChange={(e) => setDestInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDestLocationSubmit(destInput)}
                      />
                      <button 
                        onClick={() => inv.setIsLocationModalOpen(true, 'destination')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        <Search size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDestLocationSubmit(destInput)}
                  className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg shadow-lg active:bg-blue-700"
                >
                  재고 이동 실행
                </button>
              </div>
            </div>

            {/* Confirmation Popup */}
            {isConfirmMoveOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[70]">
                <div className="bg-white rounded-2xl p-6 w-full max-w-[280px] flex flex-col gap-5 shadow-2xl text-center">
                  <div className="flex flex-col gap-2">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MoveHorizontal size={32} />
                    </div>
                    <h2 className="text-xl font-bold italic">정말로 이동하시겠습니까?</h2>
                    <div className="bg-gray-50 p-3 rounded-lg flex flex-col gap-1 text-sm border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-500">이동 수량</span>
                        <span className="font-bold text-blue-600">{inv.moveQty}개</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                        <span className="text-gray-500">목적지</span>
                        <span className="font-bold">{inv.destinationLocation?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsConfirmMoveOpen(false)} className="flex-1 p-3 bg-gray-100 rounded-xl font-bold text-gray-600 active:bg-gray-200">취소</button>
                    <button onClick={executeMove} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold shadow-md active:bg-blue-700">이동 확정</button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Toast */}
            {showToast && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-4 rounded-2xl flex flex-col items-center gap-2 z-[100] animate-bounce">
                <Check size={40} className="text-green-400" />
                <span className="font-bold text-lg uppercase tracking-widest">Move Success</span>
              </div>
            )}
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
            
            {/* Product Info Summary (Fixed) */}
            <div className="bg-gray-50 p-2.5 border-b border-gray-200 flex flex-col gap-0.5 shrink-0">
              <div className="text-xs text-blue-600 font-bold">{selectedSku.code}</div>
              <div className="font-bold text-lg leading-tight">{selectedSku.name}</div>
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-500">{selectedSku.option}</span>
                <span className="font-bold text-xl text-blue-600">진행: {currentProgressQty}/{selectedSku.expectedQty}</span>
              </div>
            </div>

            {/* Main Content Area (Scrollable only for defect items) */}
            <div className="flex-1 flex flex-col overflow-hidden p-2 gap-3">
              {/* Image Section (Shrinkable but visible) */}
              <div className="shrink-0 flex flex-col gap-1">
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

              {/* Normal Quantity Section (Fixed height) */}
              <div className="shrink-0 flex flex-col gap-1.5 overflow-hidden">
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

              {/* Defect Section Wrapper */}
              <div className="flex-1 flex flex-col min-h-0 border-t border-gray-100 pt-2 gap-2">
                <div className="shrink-0 flex justify-between items-center">
                  <div className="text-sm font-bold">결함 수량</div>
                  <div className="text-[11px] font-bold text-red-600">총 {totalDefects}개</div>
                </div>
                
                <button 
                  onClick={() => setIsDefectModalOpen(true)}
                  className="shrink-0 w-full p-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs border border-red-100 flex items-center justify-center gap-1 active:bg-red-100"
                >
                  + 결함 추가
                </button>

                {/* Only this part scrollable */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
                  {selectedSku.defects.length > 0 && selectedSku.defects.map((d) => (
                    <div key={d.id} className="bg-white border border-gray-200 rounded-lg p-1.5 flex items-center justify-between shadow-sm shrink-0">
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
                  
                  {mode === 'Standard' && (
                    <button 
                      className="mt-1 bg-green-50 text-green-700 p-2 rounded-lg font-bold text-xs border border-green-200 active:bg-green-100 shadow-sm shrink-0"
                      onClick={() => {
                        setPrintQty(selectedSku.receivedQty)
                        setIsPrintPopupOpen(true)
                      }}
                    >
                      바코드 생성 및 라벨 출력
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2 bg-white border-t border-gray-200 shrink-0">
              <button 
                onClick={() => setIsCompletePopupOpen(true)}
                className="w-full bg-black text-white p-3 rounded-lg font-bold text-lg shadow active:bg-gray-900"
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

  useEffect(() => {
    const handleNav = () => setScreen('INV_PROD_SELECT')
    const handleSetDest = (e: any) => setDestInput(e.detail)
    
    window.addEventListener('nav-inv-prod', handleNav)
    window.addEventListener('set-dest-input', handleSetDest)
    return () => {
      window.removeEventListener('nav-inv-prod', handleNav)
      window.removeEventListener('set-dest-input', handleSetDest)
    }
  }, [])

  return (
    <div className="w-full h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-[360px] bg-white shadow-2xl h-screen flex flex-col relative overflow-hidden">
        {renderScreen()}
        <LocationSearchModal />
      </div>
    </div>
  )
}

function LocationSearchModal() {
  const inv = useInventoryStore()
  const [selectedZone, setSelectedZone] = useState('전체')
  
  if (!inv.isLocationModalOpen) return null

  const zones = ['전체', 'ZONE-A', 'ZONE-B', 'ZONE-C', 'ZONE-D']
  
  const filteredLocations = selectedZone === '전체' 
    ? MOCK_LOCATIONS 
    : MOCK_LOCATIONS.filter(l => l.name.startsWith(selectedZone.replace('ZONE-', 'LOC-')))

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Available': return '가용'
      case 'Mixed': return '혼적'
      case 'Unavailable': return '불용'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex justify-center">
      <div className="w-full max-w-[360px] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        <header className="bg-gray-900 text-white p-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold italic">로케이션 검색</h2>
          <button onClick={() => inv.setIsLocationModalOpen(false)} className="p-1"><X size={24} /></button>
        </header>

        {/* Zone Selector (Select Box) */}
        <div className="p-3 bg-gray-100 border-b border-gray-200 shrink-0">
          <select 
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 font-bold text-gray-700 bg-white outline-none focus:border-blue-500"
          >
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredLocations.map(loc => (
            <button
              key={loc.id}
              onClick={() => {
                if (inv.modalMode === 'source') {
                  inv.setSourceLocation(loc)
                  inv.setProducts(MOCK_PRODUCTS_BY_LOC[loc.id] || [])
                  window.dispatchEvent(new CustomEvent('nav-inv-prod'))
                } else {
                  inv.setDestinationLocation(loc)
                  window.dispatchEvent(new CustomEvent('set-dest-input', { detail: loc.name }))
                }
                inv.setIsLocationModalOpen(false)
              }}
              className="w-full p-4 border-b border-gray-100 flex items-center justify-between active:bg-gray-50"
            >
              <div className="flex flex-col text-left">
                <span className="font-bold text-lg text-gray-800">{loc.name}</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  loc.status === 'Available' ? 'text-green-600' : 
                  loc.status === 'Mixed' ? 'text-orange-600' : 'text-red-600'
                }`}>{translateStatus(loc.status)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">품목 수량</div>
                  <div className="text-lg font-bold text-gray-700">{loc.itemCount}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase leading-none">전체 상품 수량</div>
                  <div className="text-xl font-black text-gray-900">{loc.totalQty}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
