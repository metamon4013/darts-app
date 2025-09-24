import { useState } from 'react';

export interface Player {
  id: string;
  name: string;
  score: number;
  isActive: boolean;
  gameHistory: number[];
  dartHistory: any[];
  isFinished: boolean;
  currentThrow: number; // 現在の投数（1-3）
  currentTurnScores: number[]; // 現在のターンでの投数
  turnHistory: number[][]; // ターンごとの履歴
}

interface PlayerSetupProps {
  onGameStart: (players: Player[]) => void;
  onCancel: () => void;
}

export default function PlayerSetup({ onGameStart, onCancel }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(1);
  const [playerNames, setPlayerNames] = useState<string[]>(['プレイヤー1']);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newNames = Array.from({ length: count }, (_, i) =>
      playerNames[i] || `プレイヤー${i + 1}`
    );
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name || `プレイヤー${index + 1}`;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name,
      score: 501,
      isActive: index === 0, // 最初のプレイヤーをアクティブに
      gameHistory: [],
      dartHistory: [],
      isFinished: false,
      currentThrow: 1, // 1投目から開始
      currentTurnScores: [], // 現在のターンの投数
      turnHistory: [] // ターンごとの履歴
    }));

    onGameStart(players);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">ゲーム設定</h2>

      <div className="space-y-6">
        {/* プレイヤー数選択 */}
        <div>
          <label className="block text-sm font-medium mb-3">
            プレイヤー数: {playerCount}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => handlePlayerCountChange(count)}
                className={`py-2 px-4 rounded font-bold ${
                  playerCount === count
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* プレイヤー名入力 */}
        <div>
          <label className="block text-sm font-medium mb-3">プレイヤー名</label>
          <div className="space-y-3">
            {playerNames.slice(0, playerCount).map((name, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-sm text-gray-400 w-16">
                  {index + 1}:
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder={`プレイヤー${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* プレイ順序の説明 */}
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="font-semibold mb-2">プレイ順序:</h3>
          <ol className="text-sm text-gray-300 space-y-1">
            {playerNames.slice(0, playerCount).map((name, index) => (
              <li key={index}>
                {index + 1}. {name}
                {index === 0 && <span className="text-green-400 ml-2">(先攻)</span>}
              </li>
            ))}
          </ol>
        </div>

        {/* ボタン */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded font-bold"
          >
            キャンセル
          </button>
          <button
            onClick={handleStartGame}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-bold"
          >
            ゲーム開始
          </button>
        </div>
      </div>
    </div>
  );
}