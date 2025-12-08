export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'client' | 'admin' | 'tech';
}

export interface HistoryLog {
  data: string;
  descricao: string;
  tipo: string;
  tecnico: string;
  pecas?: string[];
  details?: any;
}

export interface Extinguisher {
  id: string;
  sede?: string;
  localizacao?: string;
  tipo?: string;
  capacidade?: string;
  marca?: string;
  fabricacao?: string;
  numeroCilindro?: string;
  ultimaManutencao?: string;
  proximaManutencao?: string;
  testeHidrostatico?: string;
  ultimaVistoria?: string;
  proximaVistoria?: string;
  status: string;
  clientId?: string;
  historico?: HistoryLog[];
  fotoLocal?: string;
}

export interface Alarm {
  id: string;
  sede?: string;
  local?: string;
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
}

export interface Hydrant {
  id: string;
  sede?: string;
  local?: string;
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
}

export interface Lighting {
  id: string;
  sede?: string;
  local?: string;
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
}

export const MOCK_USERS: User[] = [
  { id: 'cli_001', name: 'Grupo Marista', email: 'cliente@demo.com', password: '123', role: 'client' },
  { id: 'admin_001', name: 'Gestor Master', email: 'admin@demo.com', password: '123', role: 'admin' },
  { id: 'tec_001', name: 'Técnico de Campo', email: 'tec@demo.com', password: '123', role: 'tech' }
];
