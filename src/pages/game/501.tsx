import { useState, useEffect } from 'react';
import { useBluetoothContext } from '@/contexts/BluetoothContext';
import DartBoard from '@/components/DartBoard';
import ScoreDisplay from '@/components/ScoreDisplay';

interface BluetoothData {
  deviceId: string;
  x?: number;
  y?: number;
  rawData?: string;
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI: {
      onBluetoothData: (callback: (event: any, data: BluetoothData) => void) => void;
      removeBluetoothDataListener: (callback: (event: any, data: BluetoothData) => void) => void;
    };
  }
}

export default function Game501() {
  const [score, setScore] = useState(501);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [gameCompleted, setGameCompleted] = useState(false);
  const { isConnected } = useBluetoothContext();

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

  const handleDartHit = (points: number) => {
    if (gameCompleted) return;

    const newScore = score - points;

    // バーストチェック（0未満または1で終わる）
    if (newScore < 0 || newScore === 1) {
      console.log('バースト！');
      return;
    }

    setScore(newScore);
    setGameHistory([...gameHistory, points]);

    // ゲーム完了チェック
    if (newScore === 0) {
      setGameCompleted(true);
      console.log('ゲーム完了！');
    }
  };

  const resetGame = () => {
    setScore(501);
    setGameHistory([]);
    setGameCompleted(false);
  };

  // Bluetooth data listener
  useEffect(() => {
    if (!isConnected) return;

    const handleBluetoothData = (event: any, data: BluetoothData) => {
      if (data.x !== undefined && data.y !== undefined) {
        const points = calculatePointsFromCoordinates(data.x, data.y);
        handleDartHit(points);
      }
    };

    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onBluetoothData(handleBluetoothData);

      return () => {
        window.electronAPI.removeBluetoothDataListener(handleBluetoothData);
      };
    }
  }, [isConnected, score, gameHistory, gameCompleted]);

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">501ゲーム</h1>
        <p className="text-gray-400">501点からちょうど0点を目指しましょう</p>
      </div>

      {gameCompleted && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-6 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 ゲーム完了！</h2>
          <p className="text-green-300">
            {gameHistory.length} 投でフィニッシュしました！
          </p>
          <button
            onClick={resetGame}
            className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            新しいゲーム
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ScoreDisplay
            currentScore={score}
            gameHistory={gameHistory}
            onReset={resetGame}
          />

          {!isConnected && (
            <div className="mt-4 p-4 bg-blue-900 border border-blue-700 rounded-lg">
              <h3 className="font-bold mb-2">💡 ヒント</h3>
              <p className="text-sm text-blue-300">
                Dartsioデバイスを接続すると自動でスコアが計算されます。
                手動でプレイする場合は、下のダーツボードをクリックしてください。
              </p>
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-bold mb-2">ルール</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 501点からスタート</li>
              <li>• ちょうど0点でフィニッシュ</li>
              <li>• 0未満または1点でバースト</li>
              <li>• ダブルでフィニッシュ推奨</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <DartBoard
            onDartHit={handleDartHit}
            disabled={gameCompleted}
          />
        </div>
      </div>
    </div>
  );
}