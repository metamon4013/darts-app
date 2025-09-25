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
  // シングルプレイヤーの場合は仮想的なプレイヤー配列を作成
  const playersToDisplay = players.length === 0 ? [{
    id: 'single-player',
    name: singlePlayerName || 'プレイヤー1',
    score: singlePlayerScore || 501,
    gameHistory: singlePlayerGameHistory,
    currentThrow: singlePlayerCurrentThrow,
    currentTurnScores: singlePlayerCurrentTurnScores,
    turnHistory: singlePlayerTurnHistory,
    isActive: true,
    isFinished: (singlePlayerScore || 501) === 0
  }] : players;

  const isMultiPlayer = players.length > 1;

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
            {isMultiPlayer ? (
              <>勝者: <span className="font-bold">{winner.name}</span></>
            ) : (
              <span className="font-bold">ゲーム完了！</span>
            )}
          </p>
          <p className="text-sm text-green-400">
            {winner.gameHistory ? winner.gameHistory.length : 0} 投でフィニッシュ！
          </p>
        </div>
      )}

      {/* プレイヤーカードを表示（シングル・マルチ統一） */}
      <div className={`grid gap-4 justify-center ${
        playersToDisplay.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : playersToDisplay.length === 2
          ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
          : playersToDisplay.length === 3
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto'
      }`}>
        {playersToDisplay.map((player, index) => (
          <PlayerScoreCard
            key={player.id}
            playerName={isMultiPlayer ? `${index + 1}. ${player.name}` : player.name}
            currentScore={player.score}
            gameHistory={player.gameHistory || []}
            currentThrow={player.currentThrow || 1}
            currentTurnScores={player.currentTurnScores || []}
            turnHistory={player.turnHistory || []}
            isActive={player.isActive}
            isFinished={player.isFinished}
            isGameCompleted={gameCompleted}
            allowNameEdit={!isMultiPlayer}
          />
        ))}
      </div>
    </div>
  );
}