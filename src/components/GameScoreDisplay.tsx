import { Player } from './PlayerSetup';
import PlayerScoreCard from './PlayerScoreCard';

interface GameScoreDisplayProps {
  // シングルプレイヤー用props
  singlePlayerName?: string;
  singlePlayerScore?: number;
  singlePlayerGameHistory?: number[];
  singlePlayerCurrentThrow?: number;
  singlePlayerCurrentTurnScores?: number[];
  singlePlayerTurnHistory?: number[][];

  // マルチプレイヤー用props
  players?: Player[];
  currentPlayerIndex?: number;

  // 共通props
  gameCompleted: boolean;
  winner?: Player;
  onReset: () => void;
}

export default function GameScoreDisplay({
  singlePlayerName,
  singlePlayerScore,
  singlePlayerGameHistory = [],
  singlePlayerCurrentThrow = 1,
  singlePlayerCurrentTurnScores = [],
  singlePlayerTurnHistory = [],
  players = [],
  currentPlayerIndex = 0,
  gameCompleted,
  winner,
  onReset
}: GameScoreDisplayProps) {
  const isMultiPlayer = players.length > 1;

  if (isMultiPlayer) {
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
              {winner.gameHistory ? winner.gameHistory.length : 0} 投でフィニッシュ！
            </p>
          </div>
        )}

        {/* プレイヤーカードを横並びで表示 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {players.map((player, index) => (
            <PlayerScoreCard
              key={player.id}
              playerName={`${index + 1}. ${player.name}`}
              currentScore={player.score}
              gameHistory={player.gameHistory || []}
              currentThrow={player.currentThrow || 1}
              currentTurnScores={player.currentTurnScores || []}
              turnHistory={player.turnHistory || []}
              isActive={player.isActive}
              isFinished={player.isFinished}
              isGameCompleted={gameCompleted}
              allowNameEdit={false}
            />
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

  // シングルプレイヤー表示
  return (
    <div className="max-w-md mx-auto">
      <PlayerScoreCard
        playerName={singlePlayerName || 'プレイヤー1'}
        currentScore={singlePlayerScore || 501}
        gameHistory={singlePlayerGameHistory}
        currentThrow={singlePlayerCurrentThrow}
        currentTurnScores={singlePlayerCurrentTurnScores}
        turnHistory={singlePlayerTurnHistory}
        isActive={true}
        isFinished={singlePlayerScore === 0}
        isGameCompleted={gameCompleted}
        onReset={onReset}
        showResetButton={true}
        allowNameEdit={true}
      />
    </div>
  );
}