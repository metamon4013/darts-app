import { useState } from 'react';

interface DartBoardProps {
  onDartHit: (points: number) => void;
}

export default function DartBoard({ onDartHit }: DartBoardProps) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 2 | 3>(1);

  const sections = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

  const handleSectionClick = (section: number) => {
    setSelectedSection(section);
  };

  const handleMultiplierClick = (multiplier: 1 | 2 | 3) => {
    setSelectedMultiplier(multiplier);
  };

  const handleSubmit = () => {
    if (selectedSection !== null) {
      const points = selectedSection * selectedMultiplier;
      onDartHit(points);
      setSelectedSection(null);
      setSelectedMultiplier(1);
    }
  };

  const handleSpecialHit = (points: number) => {
    onDartHit(points);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-center">ダーツボード (手動入力)</h2>

      <div className="space-y-6">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-2">特別エリア</div>
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <button
              onClick={() => handleSpecialHit(50)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
            >
              Bull (50)
            </button>
            <button
              onClick={() => handleSpecialHit(25)}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
            >
              Outer Bull (25)
            </button>
            <button
              onClick={() => handleSpecialHit(0)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded col-span-2"
            >
              ミス (0点)
            </button>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400 mb-2 text-center">数字セクション</div>
          <div className="grid grid-cols-10 gap-1 max-w-2xl mx-auto">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => handleSectionClick(section)}
                className={`p-2 rounded font-bold text-sm ${
                  selectedSection === section
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {selectedSection !== null && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-2 text-center">倍率</div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                <button
                  onClick={() => handleMultiplierClick(1)}
                  className={`px-4 py-2 rounded font-bold ${
                    selectedMultiplier === 1
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  シングル (×1)
                </button>
                <button
                  onClick={() => handleMultiplierClick(2)}
                  className={`px-4 py-2 rounded font-bold ${
                    selectedMultiplier === 2
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  ダブル (×2)
                </button>
                <button
                  onClick={() => handleMultiplierClick(3)}
                  className={`px-4 py-2 rounded font-bold ${
                    selectedMultiplier === 3
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  トリプル (×3)
                </button>
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {selectedSection} × {selectedMultiplier} = {selectedSection * selectedMultiplier}点
              </div>
              <button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-bold"
              >
                スコアを追加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}