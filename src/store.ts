import { create } from 'zustand'

export type InventoryStatus = 'Available' | 'Unavailable' | 'Mixed'

export interface InventoryProduct {
  id: string
  code: string
  barcode: string
  name: string
  option: string
  status: string
  qty: number
}

export interface LocationInfo {
  id: string
  name: string
  status: InventoryStatus
  itemCount: number
  totalQty: number
}

interface InventoryMoveState {
  sourceLocation: LocationInfo | null
  products: InventoryProduct[]
  selectedProduct: InventoryProduct | null
  destinationLocation: LocationInfo | null
  moveQty: number
  isLocationModalOpen: boolean
  modalMode: 'source' | 'destination'
  
  // Actions
  setSourceLocation: (loc: LocationInfo | null) => void
  setProducts: (products: InventoryProduct[]) => void
  setSelectedProduct: (product: InventoryProduct | null) => void
  setDestinationLocation: (loc: LocationInfo | null) => void
  setMoveQty: (qty: number) => void
  setIsLocationModalOpen: (isOpen: boolean, mode?: 'source' | 'destination') => void
  reset: () => void
}

export const useInventoryStore = create<InventoryMoveState>((set) => ({
  sourceLocation: null,
  products: [],
  selectedProduct: null,
  destinationLocation: null,
  moveQty: 0,
  isLocationModalOpen: false,
  modalMode: 'source',

  setSourceLocation: (loc) => set({ sourceLocation: loc }),
  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ 
    selectedProduct: product, 
    moveQty: product ? product.qty : 0 
  }),
  setDestinationLocation: (loc) => set({ destinationLocation: loc }),
  setMoveQty: (qty) => set({ moveQty: qty }),
  setIsLocationModalOpen: (isOpen, mode = 'source') => set({ isLocationModalOpen: isOpen, modalMode: mode }),
  reset: () => set({
    sourceLocation: null,
    products: [],
    selectedProduct: null,
    destinationLocation: null,
    moveQty: 0,
    isLocationModalOpen: false
  })
}))

// Mock Data
export const MOCK_LOCATIONS: LocationInfo[] = [
  { id: 'LOC-A-01', name: 'LOC-A-01', status: 'Available', itemCount: 3, totalQty: 35 },
  { id: 'LOC-A-02', name: 'LOC-A-02', status: 'Available', itemCount: 1, totalQty: 10 },
  { id: 'LOC-B-05', name: 'LOC-B-05', status: 'Mixed', itemCount: 5, totalQty: 120 },
  { id: 'LOC-C-10', name: 'LOC-C-10', status: 'Unavailable', itemCount: 0, totalQty: 0 },
  { id: 'LOC-D-01', name: 'LOC-D-01', status: 'Available', itemCount: 2, totalQty: 50 },
]

export const MOCK_PRODUCTS_BY_LOC: Record<string, InventoryProduct[]> = {
  'LOC-A-01': [
    { id: 'P1', code: 'S-TEE-BLK-L', barcode: '8801234567890', name: '스탠다드 티셔츠', option: 'Black / L', status: '가용', qty: 10 },
    { id: 'P2', code: 'P-JEAN-32', barcode: '8801234567891', name: '프리미엄 청바지', option: 'Denim / 32', status: '가용', qty: 5 },
    { id: 'P3', code: 'B-SOCK-WHT', barcode: '8801234567892', name: '베이직 양말', option: 'White / Free', status: '가용', qty: 20 },
  ],
  'LOC-A-02': [
    { id: 'P1', code: 'S-TEE-BLK-L', barcode: '8801234567890', name: '스탠다드 티셔츠', option: 'Black / L', status: '가용', qty: 10 },
  ],
  'LOC-B-05': [
    { id: 'P4', code: 'O-HOOD-GRY', barcode: '8801234567893', name: '오버핏 후드티', option: 'Grey / XL', status: '가용', qty: 50 },
    { id: 'P5', code: 'S-SLAC-BLK', barcode: '8801234567894', name: '슬림핏 슬랙스', option: 'Black / 30', status: '불용', qty: 70 },
  ]
}
