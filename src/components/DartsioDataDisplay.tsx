import { useState, useEffect } from 'react';
import { parseDartsioData } from '@/utils/dartsioParser';

interface DartsioData {
  deviceId: string;
  x?: number;
  y?: number;
  rawData?: string;
  timestamp: number;
}

interface DartsioDataDisplayProps {
  isConnected: boolean;
  compact?: boolean;
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

export default function DartsioDataDisplay({ isConnected, compact = false }: DartsioDataDisplayProps) {
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

      // データを加工してパース結果も含める
      const enhancedData = { ...data };
      if (data.rawData) {
        const parsedHit = parseDartsioData(data.rawData);
        if (parsedHit) {
          (enhancedData as any).parsedHit = parsedHit;
        }
      }

      setLastData(enhancedData);
      setDataHistory(prev => [...prev.slice(-19), enhancedData]); // Keep last 20 entries
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
    if (compact) {
      return (
        <div className="bg-gray-700 p-2 rounded text-center">
          <div className="text-sm text-gray-400">データモニター - 未接続</div>
        </div>
      );
    }
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Dartsio データモニター</h2>
        <p className="text-gray-400">デバイスに接続してください</p>
      </div>
    );
  }

  // コンパクト表示
  if (compact) {
    return (
      <div className="bg-gray-700 p-2 rounded">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-green-400">データモニター</div>

          {errorMessage ? (
            <div className="text-xs text-red-400">エラー</div>
          ) : lastData ? (
            <div className="flex items-center space-x-3">
              {/* 最新データの表示 */}
              {(lastData as any).parsedHit ? (
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-blue-300">
                    {(lastData as any).parsedHit.displayText}
                  </div>
                  <div className="text-xs text-green-300">
                    {(lastData as any).parsedHit.points}点
                  </div>
                </div>
              ) : lastData.x !== undefined && lastData.y !== undefined ? (
                <div className="text-xs text-white font-mono">
                  X:{lastData.x} Y:{lastData.y}
                </div>
              ) : (
                <div className="text-xs text-white font-mono">
                  {lastData.rawData || 'データなし'}
                </div>
              )}

              {/* 最新データの時刻 */}
              <div className="text-xs text-gray-400">
                {formatTimestamp(lastData.timestamp).slice(-8)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">データ待機中...</div>
          )}
        </div>
      </div>
    );
  }

  // 通常表示
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

          {/* Dartsio形式のデータを優先表示 */}
          {(lastData as any).parsedHit ? (
            <div className="space-y-2">
              <div className="text-white font-mono text-sm">
                <div className="font-bold text-blue-300">
                  {(lastData as any).parsedHit.displayText}
                </div>
                <div className="text-green-300">
                  {(lastData as any).parsedHit.points}点 ({(lastData as any).parsedHit.type})
                </div>
              </div>
              <div className="text-gray-400 text-xs">
                生データ: {lastData.rawData}
              </div>
            </div>
          ) : lastData.x !== undefined && lastData.y !== undefined ? (
            <div className="text-white font-mono text-sm">
              X: {lastData.x}, Y: {lastData.y}
            </div>
          ) : (
            <div className="text-white font-mono text-sm">
              {lastData.rawData || 'データなし'}
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
                  {(data as any).parsedHit
                    ? `${(data as any).parsedHit.displayText} (${(data as any).parsedHit.points}点)`
                    : data.x !== undefined && data.y !== undefined
                    ? `X:${data.x}, Y:${data.y}`
                    : data.rawData || 'データなし'}
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