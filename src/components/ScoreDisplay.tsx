import { useState } from 'react';

interface ScoreDisplayProps {
  currentScore: number;
  gameHistory: number[];
  onReset: () => void;
  currentThrow?: number;
  currentTurnScores?: number[];
  turnHistory?: number[][];
}

export default function ScoreDisplay({
  currentScore,
  gameHistory,
  onReset,
  currentThrow = 1,
  currentTurnScores = [],
  turnHistory = [],
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

        {/* 現在のターン情報 */}
        {currentTurnScores.length > 0 && (
          <div className="bg-blue-900 border border-blue-700 p-3 rounded">
            <div className="text-sm text-blue-400 mb-2">現在のターン ({currentThrow}/3投目)</div>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map(throwNum => (
                <div key={throwNum} className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    throwNum <= currentTurnScores.length
                      ? 'bg-blue-500 text-white'
                      : throwNum === currentThrow
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    {throwNum <= currentTurnScores.length ? currentTurnScores[throwNum - 1] : throwNum}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-2 text-blue-300">
              このターン計: <span className="font-bold">{currentTurnScores.reduce((a, b) => a + b, 0)}点</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm text-gray-400">ターン履歴</div>
          <div className="max-h-40 overflow-y-auto bg-gray-700 p-3 rounded">
            {turnHistory.length === 0 && currentTurnScores.length === 0 ? (
              <div className="text-gray-500 text-center">まだ投げていません</div>
            ) : (
              <div className="space-y-2">
                {/* 完了済みターンを表示 */}
                {turnHistory.slice().reverse().map((turn, index) => (
                  <div key={turnHistory.length - index} className="border-b border-gray-600 pb-2 last:border-b-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-400">ターン {turnHistory.length - index}</span>
                      <span className="font-bold text-white">{turn.reduce((a, b) => a + b, 0)}点</span>
                    </div>
                    <div className="flex space-x-1">
                      {turn.map((score, throwIndex) => (
                        <div key={throwIndex} className="bg-gray-600 px-2 py-1 rounded text-xs">
                          {score}
                        </div>
                      ))}
                      {/* 空の投数を表示（3投未満の場合） */}
                      {Array.from({ length: 3 - turn.length }).map((_, emptyIndex) => (
                        <div key={`empty-${emptyIndex}`} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-500">
                          -
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 現在のターン（進行中） */}
                {currentTurnScores.length > 0 && (
                  <div className="border border-blue-500 rounded p-2 bg-blue-900/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-blue-400">現在のターン {turnHistory.length + 1}</span>
                      <span className="font-bold text-blue-300">{currentTurnScores.reduce((a, b) => a + b, 0)}点</span>
                    </div>
                    <div className="flex space-x-1">
                      {currentTurnScores.map((score, throwIndex) => (
                        <div key={throwIndex} className="bg-blue-600 px-2 py-1 rounded text-xs text-white">
                          {score}
                        </div>
                      ))}
                      {/* 残りの投数を表示 */}
                      {Array.from({ length: 3 - currentTurnScores.length }).map((_, emptyIndex) => (
                        <div key={`empty-${emptyIndex}`} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-500 border border-dashed border-gray-500">
                          ?
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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