import { useState } from 'react';

interface DartBoardProps {
  onDartHit: (points: number) => void;
  disabled?: boolean;
}

export default function DartBoard({ onDartHit, disabled = false }: DartBoardProps) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<1 | 2 | 3>(1);

  const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const handleSectionClick = (section: number) => {
    setSelectedSection(section);
  };

  const handleMultiplierClick = (multiplier: 1 | 2 | 3) => {
    setSelectedMultiplier(multiplier);
  };

  const handleSubmit = () => {
    if (selectedSection !== null && !disabled) {
      // 25と50の場合は倍率を適用しない
      const points = (selectedSection === 25 || selectedSection === 50)
        ? selectedSection
        : selectedSection * selectedMultiplier;
      onDartHit(points);
      setSelectedSection(null);
      setSelectedMultiplier(1);
    }
  };


  return (
    <div className={`bg-gray-800 p-6 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
      <h2 className="text-xl font-bold mb-4 text-center">
        ダーツボード (手動入力) {disabled && '- 無効'}
      </h2>

      <div className="space-y-6">
        <div>
          <div className="flex justify-center items-center gap-6">
            {/* 数字セクション */}
            <div className="grid grid-cols-10 gap-1">
              {sections.map((section) => (
                <button
                  key={section}
                  onClick={() => !disabled && handleSectionClick(section)}
                  disabled={disabled}
                  className={`p-3 rounded font-bold text-base ${
                    selectedSection === section
                      ? 'bg-blue-600 text-white'
                      : disabled
                      ? 'bg-gray-500 text-gray-400'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>

            {/* Bull エリア */}
            <div className="flex flex-col gap-1 ml-4">
              <button
                onClick={() => !disabled && handleSectionClick(25)}
                disabled={disabled}
                className={`p-3 rounded font-bold text-base ${
                  selectedSection === 25
                    ? 'bg-blue-600 text-white'
                    : disabled
                    ? 'bg-gray-500 text-gray-400'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                25
              </button>
              <button
                onClick={() => !disabled && handleSectionClick(50)}
                disabled={disabled}
                className={`p-3 rounded font-bold text-base ${
                  selectedSection === 50
                    ? 'bg-blue-600 text-white'
                    : disabled
                    ? 'bg-gray-500 text-gray-400'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                50
              </button>
            </div>
          </div>
        </div>

        {selectedSection !== null && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-center items-center gap-8">
                {/* 25と50の場合は倍率選択を表示しない */}
                {selectedSection !== 25 && selectedSection !== 50 && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => !disabled && handleMultiplierClick(1)}
                      disabled={disabled}
                      className={`px-4 py-2 rounded font-bold ${
                        selectedMultiplier === 1
                          ? 'bg-green-600 text-white'
                          : disabled
                          ? 'bg-gray-500 text-gray-400'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      シングル
                    </button>
                    <button
                      onClick={() => !disabled && handleMultiplierClick(2)}
                      disabled={disabled}
                      className={`px-4 py-2 rounded font-bold ${
                        selectedMultiplier === 2
                          ? 'bg-yellow-600 text-white'
                          : disabled
                          ? 'bg-gray-500 text-gray-400'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      ダブル
                    </button>
                    <button
                      onClick={() => !disabled && handleMultiplierClick(3)}
                      disabled={disabled}
                      className={`px-4 py-2 rounded font-bold ${
                        selectedMultiplier === 3
                          ? 'bg-red-600 text-white'
                          : disabled
                          ? 'bg-gray-500 text-gray-400'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      トリプル
                    </button>
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <button
                    onClick={handleSubmit}
                    disabled={disabled}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-bold"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}