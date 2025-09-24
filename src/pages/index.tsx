import Link from 'next/link';
import { useBluetoothContext } from '@/contexts/BluetoothContext';

interface GameCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

function GameCard({ title, description, href, icon }: GameCardProps) {
  return (
    <Link href={href} className="block">
      <div className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200 rounded-lg p-6 border border-gray-700 hover:border-blue-500">
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-4">{icon}</div>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <p className="text-gray-400">{description}</p>
        <div className="mt-4 text-blue-400 font-medium">
          プレイ →
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { isConnected } = useBluetoothContext();

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Dart Scorer</h1>
        <p className="text-gray-400 text-lg">ゲームを選択してください</p>

        {!isConnected && (
          <div className="mt-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg inline-block">
            <p className="text-yellow-300">
              💡 上部のヘッダーからDartsioに接続できます
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <GameCard
          title="501ゲーム"
          description="クラシックな501ダーツゲーム。501点から始めて、ちょうど0点にするゲームです。"
          href="/game/501"
          icon="🎯"
        />

        <GameCard
          title="301ゲーム"
          description="より短時間で楽しめる301ダーツゲーム。初心者にもおすすめです。"
          href="/game/301"
          icon="🏹"
        />

        <GameCard
          title="クリケット"
          description="戦略性の高いクリケットゲーム。番号を3回ずつ閉じて得点を競います。"
          href="/game/cricket"
          icon="🦗"
        />

        <GameCard
          title="ラウンド・ザ・クロック"
          description="1から20まで順番に当てていくゲーム。正確性を鍛えられます。"
          href="/game/round-the-clock"
          icon="🕐"
        />

        <GameCard
          title="カウントアップ"
          description="制限投数内でできるだけ高得点を目指すゲーム。"
          href="/game/count-up"
          icon="📈"
        />

        <GameCard
          title="フリープレイ"
          description="自由に投げて練習できるモード。スコアを記録します。"
          href="/game/free-play"
          icon="🎲"
        />
      </div>

      <div className="mt-12 text-center">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-2">Dartsio について</h2>
          <p className="text-gray-400">
            Dartsioデバイスと接続することで、自動的にダーツの着弾位置を検出し、
            正確なスコア計算が可能になります。
          </p>
        </div>
      </div>
    </div>
  );
}