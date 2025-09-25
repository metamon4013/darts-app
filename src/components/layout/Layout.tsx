import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useBluetoothContext } from '@/contexts/BluetoothContext';
import DartsioDataDisplay from '@/components/layout/DartsioDataDisplay';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { isConnected, connect, disconnect, isConnecting } = useBluetoothContext();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      // エラーハンドリングは既にconnect内で行われている
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with Bluetooth Connection */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-xl font-bold hover:text-blue-400">
                Dart Scorer
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/"
                  className={`px-3 py-2 rounded ${router.pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  ホーム
                </Link>
                <Link
                  href="/game/501"
                  className={`px-3 py-2 rounded ${router.pathname === '/game/501' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  501ゲーム
                </Link>
                <Link
                  href="/game/301"
                  className={`px-3 py-2 rounded ${router.pathname === '/game/301' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                >
                  301ゲーム
                </Link>
              </nav>
            </div>

            {/* Bluetooth Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                {isConnected ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400">Dartsio接続済み</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400">未接続</span>
                  </div>
                )}
              </div>
              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={isConnecting}
                className={`px-3 py-1 rounded text-sm ${
                  isConnected
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-600`}
              >
                {isConnecting ? '接続中...' : isConnected ? '切断' : '接続'}
              </button>
            </div>
          </div>

          {/* Data Monitor in Header */}
          <div className="max-w-4xl mx-auto">
            <DartsioDataDisplay isConnected={isConnected} compact={true} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto mt-8 px-4 py-6 pt-32">
        {children}
      </div>
    </div>
  );
}