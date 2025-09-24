export interface DartHit {
  section: number;
  multiplier: 1 | 2 | 3;
  points: number;
  type: 'single' | 'double' | 'triple' | 'bull' | 'miss';
  displayText: string;
}

/**
 * Dartsioからの生データをパースしてダーツヒット情報に変換
 * @param rawData - "S03", "D12", "T10", "B25", "B50" などの形式
 * @returns DartHit | null
 */
export function parseDartsioData(rawData: string): DartHit | null {
  const data = rawData.trim().toUpperCase();

  // ミス（0点）
  if (data === 'S00' || data === 'MISS' || data === '0') {
    return {
      section: 0,
      multiplier: 1,
      points: 0,
      type: 'miss',
      displayText: 'ミス'
    };
  }

  // Single (S + 2桁の数字)
  const singleMatch = data.match(/^S(\d{2})$/);
  if (singleMatch) {
    const section = parseInt(singleMatch[1], 10);
    if (section >= 1 && section <= 20) {
      return {
        section,
        multiplier: 1,
        points: section,
        type: 'single',
        displayText: `S${section}`
      };
    }
  }

  // Double (D + 2桁の数字)
  const doubleMatch = data.match(/^D(\d{2})$/);
  if (doubleMatch) {
    const section = parseInt(doubleMatch[1], 10);
    if (section >= 1 && section <= 20) {
      return {
        section,
        multiplier: 2,
        points: section * 2,
        type: 'double',
        displayText: `D${section}`
      };
    }
  }

  // Triple (T + 2桁の数字)
  const tripleMatch = data.match(/^T(\d{2})$/);
  if (tripleMatch) {
    const section = parseInt(tripleMatch[1], 10);
    if (section >= 1 && section <= 20) {
      return {
        section,
        multiplier: 3,
        points: section * 3,
        type: 'triple',
        displayText: `T${section}`
      };
    }
  }

  // Bull (B25 または B50)
  const bullMatch = data.match(/^B(\d{2})$/);
  if (bullMatch) {
    const value = parseInt(bullMatch[1], 10);
    if (value === 25) {
      return {
        section: 25,
        multiplier: 1,
        points: 25,
        type: 'bull',
        displayText: 'Outer Bull (25)'
      };
    } else if (value === 50) {
      return {
        section: 50,
        multiplier: 1,
        points: 50,
        type: 'bull',
        displayText: 'Inner Bull (50)'
      };
    }
  }

  // パースできない場合
  console.warn('Unknown Dartsio data format:', rawData);
  return null;
}

/**
 * ダーツヒットが有効なフィニッシュかどうかをチェック
 * @param dartHit - ダーツヒット情報
 * @returns boolean
 */
export function isValidFinish(dartHit: DartHit): boolean {
  // 501ゲームでは通常ダブルでフィニッシュする必要があるが、
  // とりあえずすべてのヒットを有効とする
  return dartHit.points > 0;
}

/**
 * テスト用のダミーデータ生成
 */
export function generateTestDartsioData(): string {
  const testData = [
    'S20', 'S01', 'S18', 'S04', 'S13', 'S06', 'S10', 'S15', 'S02', 'S17',
    'S03', 'S19', 'S07', 'S16', 'S08', 'S11', 'S14', 'S09', 'S12', 'S05',
    'D20', 'D01', 'D18', 'D04', 'D13', 'D06', 'D10', 'D15', 'D02', 'D17',
    'T20', 'T19', 'T18', 'T17', 'T16', 'T15', 'T14', 'T13', 'T12', 'T11',
    'B25', 'B50', 'S00'
  ];

  return testData[Math.floor(Math.random() * testData.length)];
}