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

declare global {
  interface Window {
    electronAPI: {
      onBluetoothData: (callback: (event: any, data: BluetoothData) => void) => void;
      removeBluetoothDataListener: (callback: (event: any, data: BluetoothData) => void) => void;
    };
  }
}

export default function Game501() {
  // ゲーム状態管理
  const [gameMode, setGameMode] = useState<'setup' | 'playing'>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastDartHit, setLastDartHit] = useState<DartHit | null>(null);

  // シングルプレイヤー用
  const [score, setScore] = useState(501);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [dartHistory, setDartHistory] = useState<DartHit[]>([]);
  const [currentThrow, setCurrentThrow] = useState(1); // 現在の投数（1-3）
  const [currentTurnScores, setCurrentTurnScores] = useState<number[]>([]); // 現在のターンの投数
  const [turnHistory, setTurnHistory] = useState<number[][]>([]); // ターンごとの履歴

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

  const handleDartHit = (points: number, dartHit?: DartHit) => {
    if (gameCompleted) return;

    // マルチプレイヤー処理
    if (players.length > 1) {
      const currentPlayer = players[currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isFinished) return;

      const newScore = currentPlayer.score - points;

      // バーストチェック（0未満または1で終わる）
      if (newScore < 0 || newScore === 1) {
        console.log(`${currentPlayer.name} バースト！ターン終了`);

        // バースト時は現在のターンを履歴に追加してリセット
        const updatedPlayers = [...players];
        updatedPlayers[currentPlayerIndex] = {
          ...currentPlayer,
          currentThrow: 1, // リセット
          isActive: false,
          currentTurnScores: [], // バースト時もリセット
          turnHistory: [...currentPlayer.turnHistory, [...currentPlayer.currentTurnScores]]
        };
        setPlayers(updatedPlayers);

        // 次のプレイヤーに交代
        nextPlayer();
        return;
      }

      // プレイヤー情報を更新
      const updatedPlayers = [...players];
      const updatedCurrentPlayer = {
        ...currentPlayer,
        score: newScore,
        gameHistory: [...currentPlayer.gameHistory, points],
        dartHistory: dartHit ? [...currentPlayer.dartHistory, dartHit] : currentPlayer.dartHistory,
        isFinished: newScore === 0,
        currentTurnScores: [...currentPlayer.currentTurnScores, points]
      };

      // ダーツヒット情報を更新
      if (dartHit) {
        setLastDartHit(dartHit);
      }

      // ゲーム完了チェック
      if (newScore === 0) {
        updatedCurrentPlayer.isFinished = true;
        // ゲーム完了時も現在のターンを履歴に追加
        updatedCurrentPlayer.turnHistory = [...currentPlayer.turnHistory, [...currentPlayer.currentTurnScores, points]];
        updatedPlayers[currentPlayerIndex] = updatedCurrentPlayer;
        setPlayers(updatedPlayers);
        setWinner(updatedCurrentPlayer);
        setGameCompleted(true);
        console.log(`${currentPlayer.name} ゲーム完了！`);
        return;
      }

      // 3投目まで続ける
      if (currentPlayer.currentThrow < 3) {
        // 次の投数に進む
        updatedCurrentPlayer.currentThrow = currentPlayer.currentThrow + 1;
        updatedPlayers[currentPlayerIndex] = updatedCurrentPlayer;
        setPlayers(updatedPlayers);
        console.log(`${currentPlayer.name} - ${updatedCurrentPlayer.currentThrow}投目`);
      } else {
        // 3投目完了 - 次のプレイヤーに交代
        updatedCurrentPlayer.currentThrow = 1; // リセット
        updatedCurrentPlayer.isActive = false;
        updatedCurrentPlayer.turnHistory = [...currentPlayer.turnHistory, [...currentPlayer.currentTurnScores, points]]; // ターン履歴に追加
        updatedCurrentPlayer.currentTurnScores = []; // ターン終了でリセット
        updatedPlayers[currentPlayerIndex] = updatedCurrentPlayer;
        setPlayers(updatedPlayers);

        console.log(`${currentPlayer.name} のターン終了`);
        nextPlayer();
      }

    } else {
      // シングルプレイヤー処理
      const newScore = score - points;

      // バーストチェック（0未満または1で終わる）
      if (newScore < 0 || newScore === 1) {
        console.log('バースト！ターン終了');

        // バースト時は現在のターンをリセットして次のターンへ
        const newTurnHistory = [...turnHistory, [...currentTurnScores]];
        setTurnHistory(newTurnHistory);
        setCurrentTurnScores([]);
        setCurrentThrow(1);
        return;
      }

      // スコアと履歴を更新
      const newCurrentTurnScores = [...currentTurnScores, points];
      setScore(newScore);
      setGameHistory([...gameHistory, points]);
      setCurrentTurnScores(newCurrentTurnScores);

      // ダーツヒット履歴を更新
      if (dartHit) {
        setDartHistory([...dartHistory, dartHit]);
        setLastDartHit(dartHit);
      }

      // ゲーム完了チェック
      if (newScore === 0) {
        // ゲーム完了時は現在のターンも履歴に追加
        const finalTurnHistory = [...turnHistory, newCurrentTurnScores];
        setTurnHistory(finalTurnHistory);
        setGameCompleted(true);
        console.log('ゲーム完了！');
        return;
      }

      // ターン管理（3投まで）
      if (currentThrow < 3) {
        // 次の投数に進む
        setCurrentThrow(currentThrow + 1);
        console.log(`${currentThrow + 1}投目`);
      } else {
        // 3投目完了 - 次のターンへ
        const newTurnHistory = [...turnHistory, newCurrentTurnScores];
        setTurnHistory(newTurnHistory);
        setCurrentTurnScores([]);
        setCurrentThrow(1);
        console.log('ターン終了 - 次のターンへ');
      }
    }
  };

  const handleGameStart = (newPlayers: Player[]) => {
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setGameMode('playing');
    setGameCompleted(false);
    setWinner(null);
    setLastDartHit(null);

    // シングルプレイヤーの場合は既存のstateも更新
    if (newPlayers.length === 1) {
      setScore(501);
      setGameHistory([]);
      setDartHistory([]);
      setCurrentThrow(1);
      setCurrentTurnScores([]);
      setTurnHistory([]);
    }
  };

  const resetGame = () => {
    setGameMode('setup');
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setGameCompleted(false);
    setWinner(null);
    setLastDartHit(null);

    // シングルプレイヤー用のstateもリセット
    setScore(501);
    setGameHistory([]);
    setDartHistory([]);
    setCurrentThrow(1);
    setCurrentTurnScores([]);
    setTurnHistory([]);
  };

  const nextPlayer = () => {
    if (gameCompleted) return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    // 現在のプレイヤーの投数を3に設定（ターン終了）
    const updatedPlayersWithThrowReset = [...players];
    updatedPlayersWithThrowReset[currentPlayerIndex] = {
      ...currentPlayer,
      currentThrow: 1, // 次のターンで1投目から
      isActive: false,
      turnHistory: currentPlayer.currentTurnScores.length > 0
        ? [...currentPlayer.turnHistory, [...currentPlayer.currentTurnScores]]
        : currentPlayer.turnHistory, // 現在のターンがあれば履歴に追加
      currentTurnScores: [] // ターン終了でリセット
    };

    // 次のプレイヤーを探す
    let nextIndex = (currentPlayerIndex + 1) % players.length;

    // 完了していないプレイヤーを探す
    const activePlayers = players.filter(p => !p.isFinished);
    if (activePlayers.length <= 1) {
      // ゲーム終了
      const finishedPlayer = players.find(p => p.isFinished);
      if (finishedPlayer) {
        setWinner(finishedPlayer);
        setGameCompleted(true);
      }
      return;
    }

    // 次のアクティブなプレイヤーを見つける
    while (updatedPlayersWithThrowReset[nextIndex].isFinished && nextIndex !== currentPlayerIndex) {
      nextIndex = (nextIndex + 1) % players.length;
    }

    // 次のプレイヤーをアクティブにして、1投目から開始
    updatedPlayersWithThrowReset[nextIndex] = {
      ...updatedPlayersWithThrowReset[nextIndex],
      isActive: true,
      currentThrow: 1,
      currentTurnScores: [] // 新しいターンで空からスタート
    };

    setPlayers(updatedPlayersWithThrowReset);
    setCurrentPlayerIndex(nextIndex);
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
  }, [isConnected, score, gameHistory, dartHistory, gameCompleted]);

  // ゲーム設定画面
  if (gameMode === 'setup') {
    return (
      <div>
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
      {/* シングルプレイヤー完了表示 */}
      {gameCompleted && players.length === 1 && (
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
          {players.length === 1 && (
            <p className="text-blue-400 text-sm mt-1">
              {currentThrow}/3投目
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* プレイヤー情報（中央に横並び） */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <GameScoreDisplay
              singlePlayerName="プレイヤー1"
              singlePlayerScore={score}
              singlePlayerGameHistory={gameHistory}
              singlePlayerCurrentThrow={currentThrow}
              singlePlayerCurrentTurnScores={currentTurnScores}
              singlePlayerTurnHistory={turnHistory}
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              gameCompleted={gameCompleted}
              winner={winner || undefined}
              onReset={resetGame}
            />
          </div>
        </div>

        {/* 手動入力（下部中央） */}
        <div className="flex justify-center w-full">
            <DartBoard
              onDartHit={handleDartHit}
              disabled={gameCompleted}
            />
        </div>
      </div>
    </div>
  );
}