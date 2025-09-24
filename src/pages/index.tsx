import { useState, useEffect } from 'react';
import DartBoard from '@/components/DartBoard';
import ScoreDisplay from '@/components/ScoreDisplay';
import BluetoothConnection from '@/components/BluetoothConnection';
import DartsioDataDisplay from '@/components/DartsioDataDisplay';

export default function Home() {
  const [score, setScore] = useState(501);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [gameHistory, setGameHistory] = useState<number[]>([]);

  const handleDartHit = (points: number) => {
    const newScore = score - points;
    setScore(newScore);
    setGameHistory([...gameHistory, points]);
  };

  const resetGame = () => {
    setScore(501);
    setGameHistory([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Bluetooth Dart Scorer
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <BluetoothConnection
              isConnected={isBluetoothConnected}
              onConnectionChange={setIsBluetoothConnected}
              onDartHit={handleDartHit}
            />
            <DartsioDataDisplay isConnected={isBluetoothConnected} />
            <ScoreDisplay
              currentScore={score}
              gameHistory={gameHistory}
              onReset={resetGame}
            />
          </div>

          <div className="lg:col-span-2">
            <DartBoard onDartHit={handleDartHit} />
          </div>
        </div>
      </div>
    </div>
  );
}