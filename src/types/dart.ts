export interface DartHit {
  section: number;
  multiplier: 1 | 2 | 3;
  points: number;
  timestamp: Date;
}

export interface GameState {
  playerId: string;
  currentScore: number;
  startingScore: number;
  throws: DartHit[];
  isFinished: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  address?: string;
}

export interface BluetoothData {
  deviceId: string;
  x: number;
  y: number;
  timestamp: number;
}