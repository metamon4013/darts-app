# Dart Bluetooth App

ElectronとNext.jsを使用したBluetoothダーツスコア計算アプリ

## 機能

- Bluetoothデバイスとの接続
- リアルタイムでのダーツスコア計算
- 501ゲームモード
- 手動スコア入力機能
- ゲーム統計表示

## 技術スタック

- **フロントエンド**: Next.js, React, TypeScript, Tailwind CSS
- **デスクトップ**: Electron
- **Bluetooth**: @abandonware/noble

## セットアップ

### 依存関係のインストール
```bash
cd dart-bluetooth-app
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

このコマンドでNext.jsの開発サーバーとElectronアプリが同時に起動します。

### ビルド
```bash
npm run build
npm run build:electron
```

## 使用方法

1. アプリを起動
2. 左側のパネルから「デバイスをスキャン」をクリック
3. 利用可能なBluetoothデバイスを選択して接続
4. ダーツを投げると自動的にスコアが計算されます
5. 手動入力も可能です

## プロジェクト構造

```
dart-bluetooth-app/
├── electron/           # Electronメインプロセス
├── src/
│   ├── components/     # Reactコンポーネント
│   ├── pages/         # Next.jsページ
│   ├── styles/        # スタイルファイル
│   └── types/         # TypeScript型定義
├── package.json
└── README.md
```

## 開発者向け情報

### Bluetooth座標からスコア計算

BluetoothConnectionコンポーネント内で、座標データ（x, y）からダーツボードの点数を計算しています。

### 手動入力

DartBoardコンポーネントで手動でのスコア入力が可能です。テスト用途や補助入力として利用できます。