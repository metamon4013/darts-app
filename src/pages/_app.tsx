import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { BluetoothProvider } from '@/contexts/BluetoothContext';
import Layout from '@/components/layout/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <BluetoothProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </BluetoothProvider>
  );
}