import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BluetoothContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(undefined);

export function useBluetoothContext() {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetoothContext must be used within a BluetoothProvider');
  }
  return context;
}

interface BluetoothProviderProps {
  children: ReactNode;
}

export function BluetoothProvider({ children }: BluetoothProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const COM4_PORT = 'COM4';

  const connect = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.connectBluetoothDevice(COM4_PORT);
        if (result.success) {
          setIsConnected(true);
        } else {
          console.error('Failed to connect to COM4:', result.error);
          throw new Error(result.error || 'Connection failed');
        }
      }
    } catch (error) {
      console.error('Error connecting to COM4:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.disconnectBluetoothDevice(COM4_PORT);
        if (result.success) {
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error('Error disconnecting from COM4:', error);
      throw error;
    }
  };

  return (
    <BluetoothContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        isConnecting,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
}