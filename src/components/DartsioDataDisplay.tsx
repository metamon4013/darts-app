import { useState, useEffect } from 'react';

interface DartsioData {
  deviceId: string;
  x?: number;
  y?: number;
  rawData?: string;
  timestamp: number;
}

interface DartsioDataDisplayProps {
  isConnected: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      onBluetoothData: (callback: (event: any, data: DartsioData) => void) => void;
      removeBluetoothDataListener: (callback: (event: any, data: DartsioData) => void) => void;
      onDeviceError: (callback: (event: any, data: { deviceId: string; error: string }) => void) => void;
      removeDeviceErrorListener: (callback: (event: any, data: { deviceId: string; error: string }) => void) => void;
    };
  }
}

export default function DartsioDataDisplay({ isConnected }: DartsioDataDisplayProps) {
  const [dataHistory, setDataHistory] = useState<DartsioData[]>([]);
  const [lastData, setLastData] = useState<DartsioData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isConnected) {
      setDataHistory([]);
      setLastData(null);
      setErrorMessage('');
      return;
    }

    const handleData = (event: any, data: DartsioData) => {
      console.log('Received Dartsio data:', data);
      setLastData(data);
      setDataHistory(prev => [...prev.slice(-19), data]); // Keep last 20 entries
      setErrorMessage('');
    };

    const handleError = (event: any, errorData: { deviceId: string; error: string }) => {
      console.error('Device error:', errorData);
      setErrorMessage(errorData.error);
    };

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onBluetoothData(handleData);
      window.electronAPI.onDeviceError?.(handleError);

      return () => {
        window.electronAPI.removeBluetoothDataListener(handleData);
        window.electronAPI.removeDeviceErrorListener?.(handleError);
      };
    }
  }, [isConnected]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Dartsio データモニター</h2>
        <p className="text-gray-400">デバイスに接続してください</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-3">データモニター</h2>

      {errorMessage && (
        <div className="bg-red-600 p-2 rounded mb-3 text-sm">
          <p className="text-white">エラー: {errorMessage}</p>
        </div>
      )}

      {lastData && (
        <div className="bg-gray-700 p-3 rounded mb-3">
          <h3 className="text-sm font-semibold mb-2 text-green-400">最新データ</h3>
          {lastData.x !== undefined && lastData.y !== undefined ? (
            <div className="text-white font-mono text-sm">
              X: {lastData.x}, Y: {lastData.y}
            </div>
          ) : (
            <div className="text-white font-mono text-sm">
              {lastData.rawData}
            </div>
          )}
          <div className="text-gray-400 text-xs mt-1">
            {formatTimestamp(lastData.timestamp)}
          </div>
        </div>
      )}

      {dataHistory.length > 0 && (
        <div className="bg-gray-700 p-3 rounded">
          <h3 className="text-sm font-semibold mb-2">履歴 ({dataHistory.length})</h3>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {dataHistory.slice().reverse().slice(0, 5).map((data, index) => (
              <div key={`${data.timestamp}-${index}`} className="text-xs">
                <span className="text-gray-400">{formatTimestamp(data.timestamp).slice(-8)}</span>
                <span className="ml-2 text-white font-mono">
                  {data.x !== undefined && data.y !== undefined
                    ? `X:${data.x}, Y:${data.y}`
                    : data.rawData}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dataHistory.length === 0 && !lastData && (
        <div className="text-gray-400 text-center py-4 text-sm">
          <p>データ待機中...</p>
        </div>
      )}
    </div>
  );
}