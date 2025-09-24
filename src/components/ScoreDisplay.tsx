import { useState } from 'react';

interface ScoreDisplayProps {
  currentScore: number;
  gameHistory: number[];
  onReset: () => void;
}

export default function ScoreDisplay({
  currentScore,
  gameHistory,
  onReset,
}: ScoreDisplayProps) {
  const [playerName, setPlayerName] = useState('プレイヤー1');

  const isGameFinished = currentScore === 0;
  const isGameBust = currentScore < 0;

  const getScoreColor = () => {
    if (isGameFinished) return 'text-green-400';
    if (isGameBust) return 'text-red-400';
    if (currentScore <= 50) return 'text-yellow-400';
    return 'text-white';
  };

  const totalThrows = gameHistory.length;
  const averagePerThrow = totalThrows > 0 ? (501 - currentScore) / totalThrows : 0;

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="space-y-4">
        <div className="text-center">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="bg-gray-700 text-white text-xl font-bold text-center px-3 py-2 rounded w-full"
          />
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">現在のスコア</div>
          <div className={`text-6xl font-bold ${getScoreColor()}`}>
            {isGameBust ? 'BUST' : currentScore}
          </div>
          {isGameFinished && (
            <div className="text-2xl text-green-400 font-bold mt-2">
              🎯 フィニッシュ！
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">投げた回数</div>
            <div className="text-xl font-bold">{totalThrows}</div>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400">平均</div>
            <div className="text-xl font-bold">{averagePerThrow.toFixed(1)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-400">最近の投擲</div>
          <div className="max-h-32 overflow-y-auto bg-gray-700 p-3 rounded">
            {gameHistory.length === 0 ? (
              <div className="text-gray-500 text-center">まだ投げていません</div>
            ) : (
              <div className="space-y-1">
                {gameHistory.slice(-5).reverse().map((points, index) => (
                  <div key={index} className="flex justify-between">
                    <span>投擲 {gameHistory.length - index}</span>
                    <span className="font-bold">{points}点</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onReset}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
        >
          ゲームリセット
        </button>
      </div>
    </div>
  );
}