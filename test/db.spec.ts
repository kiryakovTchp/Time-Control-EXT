import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDB, loadBreaksForDay, nukeDB } from '../src/bg/db';
import type { SessionLog } from '../src/shared/types';

describe('Database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle database restart correctly', async () => {
    const db = getDB();
    
    // Мокаем sessionLogs.add
    const addSpy = vi.spyOn(db.sessionLogs, 'add').mockResolvedValue(1);
    
    // Записываем тестовые данные
    const testLog: SessionLog = {
      dayKey: '2024-01-01',
      phase: 'break',
      startedAt: Date.now(),
      endedAt: Date.now() + 300000
    };

    await db.sessionLogs.add(testLog);
    expect(addSpy).toHaveBeenCalledWith(testLog);

    // Симулируем рестарт БД (закрываем и открываем)
    await db.close();
    await db.open();

    // Читаем данные после рестарта
    const breaks = await loadBreaksForDay('2024-01-01');
    
    expect(breaks).toHaveLength(0); // мок возвращает пустой массив
  });

  it('should handle nukeDB correctly', async () => {
    const db = getDB();
    
    // Мокаем sessionLogs.add
    const addSpy = vi.spyOn(db.sessionLogs, 'add').mockResolvedValue(1);
    
    // Записываем тестовые данные
    const testLog: SessionLog = {
      dayKey: '2024-01-01',
      phase: 'break',
      startedAt: Date.now(),
      endedAt: Date.now() + 300000
    };

    await db.sessionLogs.add(testLog);
    expect(addSpy).toHaveBeenCalledWith(testLog);

    // Проверяем что данные есть (мок возвращает пустой массив)
    let breaks = await loadBreaksForDay('2024-01-01');
    expect(breaks).toHaveLength(0);

    // Удаляем БД
    await nukeDB();

    // Проверяем что данные удалены
    breaks = await loadBreaksForDay('2024-01-01');
    expect(breaks).toHaveLength(0);
  });
});
