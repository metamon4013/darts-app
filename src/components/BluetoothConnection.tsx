import { useState, useEffect } from 'react';
import { BluetoothDevice, BluetoothData } from '@/types/dart';

interface BluetoothConnectionProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  onDartHit: (points: number) => void;
}

declare global {
  interface Window {
    electronAPI: {
      getBluetoothDevices: () => Promise<BluetoothDevice[]>;
      connectBluetoothDevice: (deviceId: string) => Promise<{ success: boolean; deviceId: string }>;
      disconnectBluetoothDevice: (deviceId: string) => Promise<{ success: boolean; deviceId: string }>;
      onBluetoothData: (callback: (event: any, data: BluetoothData) => void) => void;
      removeBluetoothDataListener: (callback: (event: any, data: BluetoothData) => void) => void;
    };
  }
}

export default function BluetoothConnection({
  isConnected,
  onConnectionChange,
  onDartHit,
}: BluetoothConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const COM4_PORT = 'COM4';

  const connectToCOM4 = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.connectBluetoothDevice(COM4_PORT);
        if (result.success) {
          onConnectionChange(true);
        } else {
          console.error('Failed to connect to COM4:', result.error);
        }
      }
    } catch (error) {
      console.error('Error connecting to COM4:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromCOM4 = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.disconnectBluetoothDevice(COM4_PORT);
        if (result.success) {
          onConnectionChange(false);
        }
      }
    } catch (error) {
      console.error('Error disconnecting from COM4:', error);
    }
  };

  useEffect(() => {
    const handleBluetoothData = (event: any, data: BluetoothData) => {
      const points = calculatePointsFromCoordinates(data.x, data.y);
      onDartHit(points);
    };

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onBluetoothData(handleBluetoothData);

      return () => {
        window.electronAPI.removeBluetoothDataListener(handleBluetoothData);
      };
    }
  }, [onDartHit]);

  const calculatePointsFromCoordinates = (x: number, y: number): number => {
    const centerX = 0;
    const centerY = 0;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    if (distance < 6.35) return 50;
    if (distance < 15.9) return 25;
    if (distance < 107) return getDartBoardSection(x, y);
    if (distance < 115) return getDartBoardSection(x, y) * 3;
    if (distance < 162) return getDartBoardSection(x, y);
    if (distance < 170) return getDartBoardSection(x, y) * 2;

    return 0;
  };

  const getDartBoardSection = (x: number, y: number): number => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const normalizedAngle = ((angle + 360 + 9) % 360);
    const sections = [6, 13, 4, 18, 1, 20, 5, 12, 9, 14, 11, 8, 16, 7, 19, 3, 17, 2, 15, 10];
    const sectionIndex = Math.floor(normalizedAngle / 18);
    return sections[sectionIndex] || 0;
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4">
      <h2 className="text-lg font-bold mb-3">Dartsio接続 (COM4)</h2>

      {!isConnected ? (
        <button
          onClick={connectToCOM4}
          disabled={isConnecting}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded w-full"
        >
          {isConnecting ? '接続中...' : 'Dartsioに接続'}
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-green-400">✓ Dartsio接続済み (COM4)</p>
          <button
            onClick={disconnectFromCOM4}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded w-full"
          >
            切断
          </button>
        </div>
      )}
    </div>
  );
}