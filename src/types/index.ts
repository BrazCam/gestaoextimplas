export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'client' | 'admin' | 'tech' | 'marista' | 'relocate';
}

export interface HistoryLog {
  data: string;
  descricao: string;
  tipo: string;
  tecnico: string;
  pecas?: string[];
  details?: any;
}

export interface Location {
  id: string;
  nome: string;
  setor?: string;
  sede?: string;
  exigencia?: string;
  // Note: Database uses lowercase column names (coordx, coordy, floorplanid)
  // These are mapped when reading/writing to Supabase
  coordx?: number;
  coordy?: number;
  floorplanid?: string;
}

export const EQUIPMENT_REQUIREMENTS = [
  'Pó BC',
  'Pó ABC',
  'Extintor Água',
  'Extintor CO2',
  'ESP Mecânica',
  'Mangueira Hidrante',
  'Luminária de Emergência',
  'Alarme de Incêndio'
] as const;

export type EquipmentRequirement = typeof EQUIPMENT_REQUIREMENTS[number];

export interface Extinguisher {
  id: string;
  sede?: string;
  localizacao?: string;
  locationId?: string;
  tipo?: string;
  capacidade?: string;
  marca?: string;
  fabricacao?: string;
  numeroCilindro?: string;
  codigoBarras?: string;
  ultimaManutencao?: string;
  proximaManutencao?: string;
  testeHidrostatico?: string;
  ultimaVistoria?: string;
  proximaVistoria?: string;
  status: string;
  clientId?: string;
  historico?: HistoryLog[];
  fotoLocal?: string;
  floorPlanId?: string;
  coordX?: number;
  coordY?: number;
}

export interface Alarm {
  id: string;
  sede?: string;
  local?: string;
  locationId?: string;
  tipo?: string;
  marca?: string;
  anoFabricacao?: string;
  status: string;
  ultimoTeste?: string;
  obs?: string;
  historico?: HistoryLog[];
  fotoLocal?: string;
  ultimaVistoria?: string;
  proximaVistoria?: string;
  floorPlanId?: string;
  coordX?: number;
  coordY?: number;
}

export interface Hydrant {
  id: string;
  sede?: string;
  local?: string;
  locationId?: string;
  fabricante?: string;
  anoFabricacao?: string;
  polegada?: string;
  tipo?: string;
  comprimento?: string;
  ultimoTesteHidro?: string;
  proximoTesteHidro?: string;
  ultimaVistoria?: string;
  proximaVistoria?: string;
  status: string;
  historico?: HistoryLog[];
  fotoLocal?: string;
  floorPlanId?: string;
  coordX?: number;
  coordY?: number;
}

export interface Lighting {
  id: string;
  sede?: string;
  local?: string;
  locationId?: string;
  tipo?: string;
  anoFabricacao?: string;
  autonomia?: string;
  bateria?: string;
  status: string;
  teste?: string;
  historico?: HistoryLog[];
  fotoLocal?: string;
  ultimaVistoria?: string;
  proximaVistoria?: string;
  floorPlanId?: string;
  coordX?: number;
  coordY?: number;
}

export const MOCK_USERS: User[] = [
  { id: 'cli_001', name: 'Gestao Extimplas', email: 'cliente@demo.com', password: '123', role: 'client' },
  { id: 'admin_001', name: 'Gestor Master', email: 'admin@demo.com', password: '123', role: 'admin' },
  { id: 'tec_001', name: 'Técnico de Campo', email: 'tec@demo.com', password: '123', role: 'tech' },
  { id: 'marista_001', name: 'Gestao Extimplas (Dashboard)', email: 'Gestao@extimplas.com', password: '123', role: 'marista' },
  { id: 'relo_001', name: 'Operador Realocação', email: 'relo@extimplas.com', password: '123', role: 'relocate' }
];
