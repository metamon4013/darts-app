import { useState } from 'react';

interface PlayerScoreCardProps {
  playerName: string;
  currentScore: number;
  gameHistory: number[];
  currentThrow: number;
  currentTurnScores: number[];
  turnHistory: number[][];
  isActive?: boolean;
  isFinished?: boolean;
  isGameCompleted?: boolean;
  allowNameEdit?: boolean;
  onStartEditHistoryData?: (playerIndex: number, turnIndex: number, throwIndex: number) => void;
  playerIndex?: number;
  initialScore?: number;
}

export default function PlayerScoreCard({
  playerName: initialPlayerName,
  currentScore,
  gameHistory,
  currentThrow,
  currentTurnScores,
  turnHistory,
  isActive = false,
  isFinished = false,
  isGameCompleted = false,
  allowNameEdit = true,
  onStartEditHistoryData,
  playerIndex = 0,
  initialScore = 501,
}: PlayerScoreCardProps) {
  const [playerName, setPlayerName] = useState(initialPlayerName);

  const isGameFinished = currentScore === 0;
  const isGameBust = currentScore < 0;

  const getScoreColor = () => {
    if (isGameFinished) return 'text-green-400';
    if (isGameBust) return 'text-red-400';
    if (currentScore <= 50) return 'text-yellow-400';
    return 'text-white';
  };

  const completedTurns = turnHistory.length;
  const currentTurnInProgress = currentTurnScores.length > 0 ? 1 : 0;
  const totalTurns = completedTurns + currentTurnInProgress;

  // ターンごとの平均得点を計算
  const averagePerTurn = completedTurns > 0
    ? turnHistory.reduce((sum, turn) => sum + turn.reduce((turnSum, score) => turnSum + score, 0), 0) / completedTurns
    : 0;

  const getCardBorderStyle = () => {
    if (isFinished) return 'border-green-500 bg-green-900/30';
    if (isActive && !isGameCompleted) return 'border-blue-500 bg-blue-900/50 shadow-lg shadow-blue-500/20';
    return 'border-gray-600 bg-gray-700/50';
  };

  return (
    <div className={`bg-gray-800 p-4 rounded-lg border-2 transition-colors ${getCardBorderStyle()} relative`}>
      {/* ステータスバッジ（右上） */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {isActive && !isGameCompleted && (
          <span className="bg-blue-600 text-xs px-2 py-1 rounded">
            ターン中
          </span>
        )}
        {isFinished && (
          <span className="bg-green-600 text-xs px-2 py-1 rounded">
            完了
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* プレイヤー名 */}
        <div className="text-center">
          {allowNameEdit ? (
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-gray-700 text-white text-lg font-bold text-center px-3 py-2 rounded w-full"
            />
          ) : (
            <div className="text-lg font-bold text-white">{playerName}</div>
          )}
        </div>

        {/* 現在のスコア */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor()}`}>
            {isGameBust ? 'BUST' : currentScore}
          </div>
          {isGameFinished && (
            <div className="text-lg text-green-400 font-bold mt-1">
              🎯 フィニッシュ！
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-400">ターン数</div>
            <div className="font-bold">{totalTurns}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-400">ターン平均</div>
            <div className="font-bold">{completedTurns > 0 ? averagePerTurn.toFixed(1) : '-'}</div>
          </div>
        </div>

        {/* 現在のターン情報 */}
        {/* {isActive && currentTurnScores.length > 0 && !isGameCompleted && (
          <div className="bg-blue-900 border border-blue-700 p-3 rounded">
            <div className="text-sm text-blue-400 mb-2">現在のターン</div>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3].map(throwNum => (
                <div key={throwNum} className="text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
            <div className="text-center mt-2 text-blue-300 text-sm">
              このターン計: <span className="font-bold">{currentTurnScores.reduce((a, b) => a + b, 0)}点</span>
            </div>
          </div>
        )} */}

        {/* ターン履歴 */}
        <div className="space-y-2">
          <div className="text-sm text-gray-400">ターン履歴</div>
          <div className="max-h-32 overflow-y-auto bg-gray-700 p-2 rounded">
            {turnHistory.length === 0 && currentTurnScores.length === 0 ? (
              <div className="text-gray-500 text-center text-sm">まだ投げていません</div>
            ) : (
              <div className="space-y-1">
                {/* 現在のターン（進行中）- 一番上に表示 */}
                {currentTurnScores.length > 0 && (
                  <div className="border border-blue-500 rounded p-1 bg-blue-900/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-blue-400">現在のターン {turnHistory.length + 1}</span>
                      <span className="font-bold text-blue-300 text-base w-12 text-right">{currentTurnScores.reduce((a, b) => a + b, 0)}点</span>
                    </div>
                    <div className="flex space-x-1">
                      {currentTurnScores.map((score, throwIndex) => (
                        <div
                          key={throwIndex}
                          className={`w-8 h-8 flex items-center justify-center rounded text-xs text-white transition-colors ${
                            onStartEditHistoryData && !isGameCompleted
                              ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
                              : 'bg-blue-600'
                          }`}
                          onClick={() => {
                            if (onStartEditHistoryData && !isGameCompleted) {
                              // 現在のターンはまだgamePlayDataに保存されていないため、
                              // 特別な処理が必要。ここでは仮のターンインデックスを使用
                              onStartEditHistoryData(playerIndex, -1, throwIndex);
                            }
                          }}
                        >
                          {score}
                        </div>
                      ))}
                      {/* 残りの投数を表示 */}
                      {Array.from({ length: 3 - currentTurnScores.length }).map((_, emptyIndex) => (
                        <div key={`empty-${emptyIndex}`} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded text-xs text-gray-500 border border-dashed border-gray-500">
                          ?
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 完了済みターンを表示（最新3つ） */}
                {turnHistory.slice(-3).reverse().map((turn, index) => (
                  <div key={turnHistory.length - index} className="border-b border-gray-600 pb-1 last:border-b-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">ターン {turnHistory.length - index}</span>
                      <span className="font-bold text-white text-base w-12 text-right">{turn.reduce((a, b) => a + b, 0)}点</span>
                    </div>
                    <div className="flex space-x-1">
                      {turn.map((score, throwIndex) => (
                        <div
                          key={throwIndex}
                          className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
                            onStartEditHistoryData && !isGameCompleted
                              ? 'bg-gray-600 hover:bg-gray-500 cursor-pointer'
                              : 'bg-gray-600'
                          }`}
                          onClick={() => {
                            if (onStartEditHistoryData && !isGameCompleted) {
                              const actualTurnIndex = turnHistory.length - index - 1;
                              onStartEditHistoryData(playerIndex, actualTurnIndex, throwIndex);
                            }
                          }}
                        >
                          {score}
                        </div>
                      ))}
                      {/* 空の投数を表示（3投未満の場合） */}
                      {Array.from({ length: 3 - turn.length }).map((_, emptyIndex) => (
                        <div key={`empty-${emptyIndex}`} className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded text-xs text-gray-500">
                          -
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* フィニッシュ圏内表示 */}
        {currentScore <= 170 && currentScore > 0 && !isFinished && (
          <div className="text-center text-xs text-yellow-300">
            🎯 フィニッシュ圏内
          </div>
        )}

      </div>

    </div>
  );
}