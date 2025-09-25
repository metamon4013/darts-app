import { Player } from './PlayerSetup';
import PlayerScoreCard from './PlayerScoreCard';

// プレイデータの型定義
type PlayerTurn = number[]; // 1ターンの投数データ（例: [20, 30, 7]）
type PlayerGameData = PlayerTurn[]; // 1人のプレイヤーの全ターンデータ
type GamePlayData = PlayerGameData[]; // 全プレイヤーのプレイデータ

interface GameScoreDisplayProps {
  // シングルプレイヤー用props（後方互換性のため）
  singlePlayerName?: string;
  singlePlayerScore?: number;
  singlePlayerGameHistory?: number[];
  singlePlayerCurrentThrow?: number;
  singlePlayerCurrentTurnScores?: number[];
  singlePlayerTurnHistory?: number[][];

  // マルチプレイヤー用props
  players?: Player[];
  currentPlayerIndex?: number;

  // 新しい統一プレイデータ
  gamePlayData?: GamePlayData;
  currentTurnData?: number[];

  // 共通props
  gameCompleted: boolean;
  winner?: Player;
  onReset: () => void;
  onStartEditHistoryData?: (playerIndex: number, turnIndex: number, throwIndex: number) => void;
  initialScore?: number;
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
  gamePlayData = [],
  currentTurnData = [],
  gameCompleted,
  winner,
  onReset,
  onStartEditHistoryData,
  initialScore = 501
}: GameScoreDisplayProps) {

  // プレイヤーのスコアを計算する関数
  const calculatePlayerScore = (playerIndex: number): number => {
    if (gamePlayData[playerIndex]) {
      const totalScored = gamePlayData[playerIndex].flat().reduce((sum, score) => sum + score, 0);
      // 現在投げている途中のスコアも含める
      const currentTurnScore = (playerIndex === currentPlayerIndex && currentTurnData.length > 0)
        ? currentTurnData.reduce((sum, score) => sum + score, 0)
        : 0;
      return initialScore - totalScored - currentTurnScore;
    }
    // 後方互換性: マルチプレイヤーの場合はplayers配列から取得
    if (players[playerIndex]) {
      return players[playerIndex].score;
    }
    // シングルプレイヤーの場合（現在のターンスコアも含める）
    const baseScore = singlePlayerScore || initialScore;
    const currentScore = currentTurnData.length > 0 ? currentTurnData.reduce((sum, score) => sum + score, 0) : 0;
    return baseScore - currentScore;
  };

  // プレイヤーのゲーム履歴を取得する関数
  const getPlayerGameHistory = (playerIndex: number): number[] => {
    if (gamePlayData[playerIndex]) {
      return gamePlayData[playerIndex].flat();
    }
    // 後方互換性
    if (players[playerIndex]) {
      return players[playerIndex].gameHistory || [];
    }
    return singlePlayerGameHistory;
  };

  // プレイヤーのターン履歴を取得する関数
  const getPlayerTurnHistory = (playerIndex: number): number[][] => {
    if (gamePlayData[playerIndex]) {
      return gamePlayData[playerIndex];
    }
    // 後方互換性
    if (players[playerIndex]) {
      return players[playerIndex].turnHistory || [];
    }
    return singlePlayerTurnHistory;
  };

  // シングルプレイヤーの場合は仮想的なプレイヤー配列を作成
  const playersToDisplay = players.length === 0 ? [{
    id: 'single-player',
    name: singlePlayerName || 'プレイヤー1',
    score: calculatePlayerScore(0),
    gameHistory: getPlayerGameHistory(0),
    currentThrow: singlePlayerCurrentThrow,
    currentTurnScores: currentTurnData.length > 0 ? currentTurnData : singlePlayerCurrentTurnScores,
    turnHistory: getPlayerTurnHistory(0),
    isActive: true,
    isFinished: calculatePlayerScore(0) === 0
  }] : players.map((player, index) => ({
    ...player,
    score: calculatePlayerScore(index),
    gameHistory: getPlayerGameHistory(index),
    turnHistory: getPlayerTurnHistory(index),
    currentTurnScores: index === currentPlayerIndex && currentTurnData.length > 0 ? currentTurnData : (player.currentTurnScores || [])
  }));

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
            onStartEditHistoryData={onStartEditHistoryData}
            playerIndex={isMultiPlayer ? index : 0}
            initialScore={initialScore}
          />
        ))}
      </div>
    </div>
  );
}