import { Player } from './PlayerSetup';

interface MultiPlayerScoreDisplayProps {
  players: Player[];
  onReset: () => void;
  currentPlayerIndex: number;
  gameCompleted: boolean;
  winner?: Player;
}

export default function MultiPlayerScoreDisplay({
  players,
  onReset,
  currentPlayerIndex,
  gameCompleted,
  winner
}: MultiPlayerScoreDisplayProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">スコア</h2>
        <button
          onClick={onReset}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          リセット
        </button>
      </div>

      {gameCompleted && winner && (
        <div className="bg-green-900 border border-green-700 rounded p-3 mb-4 text-center">
          <h3 className="text-green-400 font-bold text-lg">🎉 ゲーム終了！</h3>
          <p className="text-green-300">
            勝者: <span className="font-bold">{winner.name}</span>
          </p>
          <p className="text-sm text-green-400">
            {winner.gameHistory.length} 投でフィニッシュ！
          </p>
        </div>
      )}

      {/* プレイヤーカードを横並びで表示 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`p-4 rounded-lg border-2 transition-colors ${
              player.isActive && !gameCompleted
                ? 'border-blue-500 bg-blue-900/50 shadow-lg shadow-blue-500/20'
                : player.isFinished
                ? 'border-green-500 bg-green-900/30'
                : 'border-gray-600 bg-gray-700/50'
            }`}
          >
            {/* プレイヤー名とステータス */}
            <div className="text-center mb-3">
              <div className="font-bold text-lg mb-1">
                {index + 1}. {player.name}
              </div>
              <div className="flex justify-center space-x-1 mb-1">
                {player.isActive && !gameCompleted && (
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">
                    ターン中
                  </span>
                )}
                {player.isFinished && (
                  <span className="bg-green-600 text-xs px-2 py-1 rounded">
                    完了
                  </span>
                )}
              </div>

              {/* 投数カウンター */}
              {player.isActive && !gameCompleted && (
                <div className="flex flex-col items-center space-y-1">
                  <div className="text-xs text-gray-400">
                    投数: {player.currentThrow}/3
                  </div>
                  {/* 投数ドット表示 */}
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(throwNum => (
                      <div
                        key={throwNum}
                        className={`w-2 h-2 rounded-full ${
                          throwNum <= player.currentThrow
                            ? 'bg-blue-500'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* スコア表示（大きく中央） */}
            <div className="text-center mb-3">
              <div className={`text-4xl font-bold ${
                player.score <= 50 ? 'text-yellow-400' :
                player.score <= 100 ? 'text-orange-400' :
                'text-white'
              }`}>
                {player.score}
              </div>
            </div>

            {/* 統計情報 */}
            <div className="text-sm text-center mb-2">
              {/* このターンの投数（アクティブプレイヤーのみ） */}
              {player.isActive && !gameCompleted && (
                <div className="text-xs text-blue-300 mb-2 font-bold">
                  このターン: {player.currentTurnScores.length > 0 ? player.currentTurnScores.join(', ') : '未投'}
                </div>
              )}

              {/* 全体の履歴と統計 */}
              {(player.gameHistory.length > 0 || player.currentTurnScores.length > 0) && (
                <>
                  <div className="text-gray-400 mb-1">
                    履歴: {[...player.gameHistory, ...player.currentTurnScores].join(', ')}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {player.gameHistory.length + player.currentTurnScores.length}投 /
                    平均{([...player.gameHistory, ...player.currentTurnScores].reduce((a, b) => a + b, 0) / [...player.gameHistory, ...player.currentTurnScores].length).toFixed(1)}
                  </div>
                </>
              )}
            </div>

            {/* プレイヤーの状態インジケーター */}
            {player.score <= 170 && player.score > 0 && !player.isFinished && (
              <div className="text-center text-xs text-yellow-300">
                🎯 フィニッシュ圏内
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ゲーム情報 */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="flex justify-center space-x-6 text-sm text-gray-400">
          <div>プレイヤー数: <span className="text-white">{players.length}</span></div>
          <div>完了者: <span className="text-white">{players.filter(p => p.isFinished).length}</span></div>
          {!gameCompleted && (
            <div>
              現在のターン: <span className="text-blue-400 font-bold">{players[currentPlayerIndex]?.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}