import { useState, useEffect } from 'react';
import { useBluetoothContext } from '@/contexts/BluetoothContext';
import DartBoard from '@/components/DartBoard';
import PlayerSetup, { type Player } from '@/components/PlayerSetup';
import GameScoreDisplay from '@/components/GameScoreDisplay';
import { parseDartsioData, type DartHit } from '@/utils/dartsioParser';

interface BluetoothData {
  deviceId: string;
  x?: number;
  y?: number;
  rawData?: string;
  timestamp: number;
}

// プレイデータの型定義
type PlayerTurn = number[]; // 1ターンの投数データ（例: [20, 30, 7]）
type PlayerGameData = PlayerTurn[]; // 1人のプレイヤーの全ターンデータ
type GamePlayData = PlayerGameData[]; // 全プレイヤーのプレイデータ

declare global {
  interface Window {
    electronAPI: {
      onBluetoothData: (callback: (event: any, data: BluetoothData) => void) => void;
      removeBluetoothDataListener: (callback: (event: any, data: BluetoothData) => void) => void;
    };
  }
}

export default function GameCountUp() {
  // ゲーム状態管理
  const [gameMode, setGameMode] = useState<'setup' | 'playing'>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastDartHit, setLastDartHit] = useState<DartHit | null>(null);
  const [totalRounds, setTotalRounds] = useState(8); // カウントアップのラウンド数

  // 統一プレイデータ管理
  const [gamePlayData, setGamePlayData] = useState<GamePlayData>([]);
  const [currentTurnData, setCurrentTurnData] = useState<number[]>([]);
  const [currentThrow, setCurrentThrow] = useState(1);

  // シングルプレイヤー用の統計データ（後方互換性のため）
  const [dartHistory, setDartHistory] = useState<DartHit[]>([]);

  // 履歴データ修正用のstate
  const [editingHistoryData, setEditingHistoryData] = useState<{
    playerIndex: number;
    turnIndex: number;
    throwIndex: number;
    currentScore: number;
  } | null>(null);

  // 現在のプレイヤースコアを計算する関数（カウントアップでは累計）
  const getCurrentPlayerScore = (playerIndex: number): number => {
    if (!gamePlayData[playerIndex]) return 0;
    const totalScored = gamePlayData[playerIndex]
      .flat()
      .reduce((sum, score) => sum + score, 0);
    // 現在のターンのスコアも含める
    const currentTurnScore = (playerIndex === currentPlayerIndex && currentTurnData.length > 0)
      ? currentTurnData.reduce((sum, score) => sum + score, 0)
      : 0;
    return totalScored + currentTurnScore;
  };

  // ゲーム履歴を取得する関数（後方互換性のため）
  const getPlayerGameHistory = (playerIndex: number): number[] => {
    if (!gamePlayData[playerIndex]) return [];
    return gamePlayData[playerIndex].flat();
  };

  const { isConnected } = useBluetoothContext();

  // 履歴データ修正開始
  const startEditHistoryData = (playerIndex: number, turnIndex: number, throwIndex: number) => {
    if (gameCompleted) return;

    let currentScore = 0;

    // 現在のターンの修正（turnIndex === -1）
    if (turnIndex === -1) {
      // 現在のターンの得点を取得
      currentScore = currentTurnData[throwIndex] || 0;
    } else {
      // 過去のターンの修正
      currentScore = gamePlayData[playerIndex]?.[turnIndex]?.[throwIndex] || 0;
    }

    setEditingHistoryData({
      playerIndex,
      turnIndex,
      throwIndex,
      currentScore
    });
  };

  // 履歴データ修正処理
  const updateHistoryData = (newScore: number) => {
    if (!editingHistoryData) return;

    const { playerIndex, turnIndex, throwIndex } = editingHistoryData;

    // 現在のターンの修正（turnIndex === -1）
    if (turnIndex === -1) {
      // currentTurnDataを更新
      const newCurrentTurnData = [...currentTurnData];
      newCurrentTurnData[throwIndex] = newScore;
      setCurrentTurnData(newCurrentTurnData);
      console.log(`プレイヤー${playerIndex + 1}の現在のターンの投数${throwIndex + 1}を${editingHistoryData.currentScore}から${newScore}に修正`);
    } else {
      // 過去のターンの修正
      const newGamePlayData = [...gamePlayData];
      if (!newGamePlayData[playerIndex]) {
        newGamePlayData[playerIndex] = [];
      }
      if (!newGamePlayData[playerIndex][turnIndex]) {
        newGamePlayData[playerIndex][turnIndex] = [];
      }

      newGamePlayData[playerIndex][turnIndex][throwIndex] = newScore;
      setGamePlayData(newGamePlayData);
      console.log(`プレイヤー${playerIndex + 1}のターン${turnIndex + 1}の投数${throwIndex + 1}を${editingHistoryData.currentScore}から${newScore}に修正`);
    }

    // 編集モードを終了
    setEditingHistoryData(null);
  };

  // 履歴データ修正キャンセル
  const cancelEditHistoryData = () => {
    setEditingHistoryData(null);
  };

  // ターン終了処理（3投完了後のみ）
  const finishCurrentTurn = () => {
    if (gameCompleted || currentTurnData.length === 0) return;

    // 3投完了している場合のみターン終了を許可
    if (currentThrow !== 3 || currentTurnData.length < 3) return;

    const isMultiPlayer = players.length > 1;
    const playerIndex = isMultiPlayer ? currentPlayerIndex : 0;

    // 現在のターンデータをプレイデータに追加
    const newGamePlayData = [...gamePlayData];
    if (!newGamePlayData[playerIndex]) {
      newGamePlayData[playerIndex] = [];
    }
    newGamePlayData[playerIndex].push([...currentTurnData]);
    setGamePlayData(newGamePlayData);

    // ターンをリセット
    setCurrentTurnData([]);
    setCurrentThrow(1);

    // ゲーム完了チェック（指定ラウンド数に達したか）
    const completedRounds = newGamePlayData[playerIndex].length;
    if (completedRounds >= totalRounds) {
      if (isMultiPlayer) {
        // マルチプレイヤー：すべてのプレイヤーが完了したかチェック
        const allPlayersCompleted = players.every((_, index) => {
          const playerRounds = newGamePlayData[index]?.length || 0;
          return playerRounds >= totalRounds;
        });

        if (allPlayersCompleted) {
          // 全員完了：勝者を決定
          let maxScore = -1;
          let winnerIndex = 0;
          players.forEach((_, index) => {
            const playerScore = getCurrentPlayerScore(index);
            if (playerScore > maxScore) {
              maxScore = playerScore;
              winnerIndex = index;
            }
          });

          setGameCompleted(true);
          const winnerData = {
            id: players[winnerIndex].id,
            name: players[winnerIndex].name,
            score: maxScore,
            gameHistory: getPlayerGameHistory(winnerIndex),
            isFinished: true,
            isActive: false,
            currentThrow: 1,
            currentTurnScores: [],
            turnHistory: newGamePlayData[winnerIndex]
          };
          setWinner(winnerData);
          console.log(`${winnerData.name} が勝者！ スコア: ${maxScore}点`);
          return;
        } else {
          // 次のプレイヤーへ
          nextPlayer();
        }
      } else {
        // シングルプレイヤー：ゲーム完了
        setGameCompleted(true);
        const finalScore = getCurrentPlayerScore(0);
        const winnerData = {
          id: 'single-player',
          name: 'プレイヤー1',
          score: finalScore,
          gameHistory: getPlayerGameHistory(0),
          isFinished: true,
          isActive: false,
          currentThrow: 1,
          currentTurnScores: [],
          turnHistory: newGamePlayData[0]
        };
        setWinner(winnerData);
        console.log(`ゲーム完了！ 最終スコア: ${finalScore}点`);
        return;
      }
    } else {
      if (isMultiPlayer) {
        console.log(`${players[currentPlayerIndex]?.name} のターン終了（エンターキー）`);
        nextPlayer();
      } else {
        console.log('ターン終了（エンターキー） - 次のターンへ');
      }
    }
  };

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

  const handleDartHit = (points: number, dartHit?: DartHit) => {
    if (gameCompleted) return;

    // 4投目以降は無視
    if (currentTurnData.length >= 3) {
      console.log('4投目以降は無視されます - Enterキーでターン終了してください');
      return;
    }

    const isMultiPlayer = players.length > 1;
    const playerIndex = isMultiPlayer ? currentPlayerIndex : 0;

    // ダーツヒット情報を更新
    if (dartHit) {
      setDartHistory([...dartHistory, dartHit]);
      setLastDartHit(dartHit);
    }

    // 現在のターンデータに追加
    const newCurrentTurnData = [...currentTurnData, points];
    setCurrentTurnData(newCurrentTurnData);

    // ターン管理（3投まで）
    if (currentThrow < 3) {
      // 次の投数に進む
      setCurrentThrow(currentThrow + 1);
      console.log(`${isMultiPlayer ? players[currentPlayerIndex]?.name : 'プレイヤー1'} - ${currentThrow + 1}投目`);
    }
    // 3投目の場合はcurrentThrowを変更せず、エンターキーでのターン終了を待機
    if (currentThrow === 3) {
      console.log(`${isMultiPlayer ? players[currentPlayerIndex]?.name : 'プレイヤー1'} - 3投目完了、Enterキーでターン終了`);
    }
  };

  const handleGameStart = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setGameMode('playing');
    setGameCompleted(false);
    setWinner(null);
    setLastDartHit(null);

    // 統一プレイデータをリセット
    const initialGamePlayData: GamePlayData = new Array(newPlayers.length).fill(null).map(() => []);
    setGamePlayData(initialGamePlayData);
    setCurrentTurnData([]);
    setCurrentThrow(1);
    setDartHistory([]);
  };

  const resetGame = () => {
    setGameMode('setup');
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setGameCompleted(false);
    setWinner(null);
    setLastDartHit(null);

    // 統一プレイデータをリセット
    setGamePlayData([]);
    setCurrentTurnData([]);
    setCurrentThrow(1);
    setDartHistory([]);
  };

  const nextPlayer = () => {
    if (gameCompleted || players.length <= 1) return;

    // 次のプレイヤーを探す
    let nextIndex = (currentPlayerIndex + 1) % players.length;

    // 完了していないプレイヤーを探す
    const activePlayers = players.filter((_, index) => {
      const completedRounds = gamePlayData[index]?.length || 0;
      return completedRounds < totalRounds;
    });

    if (activePlayers.length <= 0) {
      // 全員完了済み
      return;
    }

    // 次のアクティブなプレイヤーを見つける
    while (true) {
      const playerRounds = gamePlayData[nextIndex]?.length || 0;
      if (playerRounds < totalRounds) {
        break; // このプレイヤーはまだ完了していない
      }
      nextIndex = (nextIndex + 1) % players.length;
      if (nextIndex === currentPlayerIndex) {
        // 一周した場合は終了
        break;
      }
    }

    // プレイヤーを更新（isActiveフラグのみ変更）
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isActive: index === nextIndex,
      currentThrow: index === nextIndex ? 1 : player.currentThrow
    }));

    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(nextIndex);
    setCurrentThrow(1);
  };

  // Bluetooth data listener
  useEffect(() => {
    if (!isConnected) return;

    const handleBluetoothData = (event: any, data: BluetoothData) => {
      console.log('Received Bluetooth data:', data);

      // 新しいDartsio形式のデータ（rawData）を優先
      if (data.rawData) {
        const dartHit = parseDartsioData(data.rawData);
        if (dartHit) {
          console.log('Parsed dart hit:', dartHit);
          handleDartHit(dartHit.points, dartHit);
        } else {
          console.warn('Failed to parse Dartsio data:', data.rawData);
        }
      }
      // 座標データ（古い形式）もサポート
      else if (data.x !== undefined && data.y !== undefined) {
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
  }, [isConnected, gamePlayData, currentTurnData, dartHistory, gameCompleted]);

  // キーボードイベントリスナー
  useEffect(() => {
    if (gameMode !== 'playing') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // エンターキーでターン終了
      if (event.key === 'Enter') {
        event.preventDefault();
        finishCurrentTurn();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameMode, gameCompleted, currentTurnData, currentPlayerIndex, players, gamePlayData]);

  // ゲーム設定画面
  if (gameMode === 'setup') {
    return (
      <div>
        <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">カウントアップ設定</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              ラウンド数
            </label>
            <select
              value={totalRounds}
              onChange={(e) => setTotalRounds(Number(e.target.value))}
              className="bg-gray-700 text-white px-3 py-2 rounded w-full"
            >
              <option value={4}>4ラウンド</option>
              <option value={6}>6ラウンド</option>
              <option value={8}>8ラウンド</option>
              <option value={10}>10ラウンド</option>
            </select>
          </div>
        </div>
        <PlayerSetup
          onGameStart={handleGameStart}
          onCancel={() => {/* ホームに戻る処理は必要に応じて */}}
        />
      </div>
    );
  }

  // ゲームプレイ画面
  return (
    <div>
      {/* 最新のダーツヒット表示 */}
      {lastDartHit && !gameCompleted && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6 text-center">
          <h3 className="text-lg font-bold text-blue-400 mb-2">
            {players.length > 1 ?
              `${players[currentPlayerIndex]?.name} の最新ダーツ` :
              '最新のダーツ'
            }
          </h3>
          <p className="text-blue-300 text-xl font-mono">
            {lastDartHit.displayText} - {lastDartHit.points}点
          </p>
          <p className="text-blue-400 text-sm mt-1">
            {players.length > 1 ?
              `${players[currentPlayerIndex]?.currentThrow || 1}/3投目` :
              `${currentThrow}/3投目`
            }
          </p>
        </div>
      )}

      {/* ゲーム進行状況 */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 mb-4 text-center">
        <p className="text-gray-400 text-sm">
          カウントアップ ({totalRounds}ラウンド制)
          {players.length > 1 && ` - 現在: ${players[currentPlayerIndex]?.name}`}
        </p>
        <p className="text-white font-bold">
          ラウンド {(gamePlayData[players.length > 1 ? currentPlayerIndex : 0]?.length || 0) + 1} / {totalRounds}
        </p>
      </div>

      {/* エンターキーヒント表示（3投完了後のみ） */}
      {!gameCompleted && currentThrow === 3 && currentTurnData.length === 3 && (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 mb-4 text-center">
          <p className="text-gray-400 text-sm">
            <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">Enter</kbd> キーでターン終了
            {players.length > 1 && ` (${players[currentPlayerIndex]?.name})`}
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* プレイヤー情報（中央に横並び） */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <GameScoreDisplay
              singlePlayerName="プレイヤー1"
              singlePlayerScore={getCurrentPlayerScore(0)}
              singlePlayerGameHistory={getPlayerGameHistory(0)}
              singlePlayerCurrentThrow={currentThrow}
              singlePlayerCurrentTurnScores={currentTurnData}
              singlePlayerTurnHistory={gamePlayData[0] || []}
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              gameCompleted={gameCompleted}
              winner={winner || undefined}
              onReset={resetGame}
              gamePlayData={gamePlayData}
              currentTurnData={currentTurnData}
              onStartEditHistoryData={startEditHistoryData}
              initialScore={0} // カウントアップなので0から開始
            />
          </div>
        </div>

        {/* 手動入力（下部中央） */}
        <div className="flex justify-center w-full">
            <DartBoard
              onDartHit={editingHistoryData ? updateHistoryData : handleDartHit}
              disabled={gameCompleted}
            />
        </div>

        {/* 履歴データ編集時のヒント */}
        {editingHistoryData && (
          <div className="bg-orange-900 border border-orange-700 rounded-lg p-4 text-center">
            <h3 className="text-lg font-bold text-orange-400 mb-2">得点修正モード</h3>
            <p className="text-orange-300 mb-2">
              プレイヤー{editingHistoryData.playerIndex + 1} -
              {editingHistoryData.turnIndex === -1 ? '現在のターン' : `ターン${editingHistoryData.turnIndex + 1}`} -
              投数{editingHistoryData.throwIndex + 1}
            </p>
            <p className="text-orange-300 text-sm mb-3">
              現在の得点: {editingHistoryData.currentScore}点
            </p>
            <p className="text-orange-200 text-sm mb-3">
              下のスコア入力で新しい得点を入力してください
            </p>
            <button
              onClick={cancelEditHistoryData}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              修正をキャンセル
            </button>
          </div>
        )}
      </div>
    </div>
  );
}