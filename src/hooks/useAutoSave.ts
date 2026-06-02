import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// 防抖Hook
// 用于实现自动保存功能
// ============================================

interface UseDebounceOptions {
  delay?: number;           // 防抖延迟（毫秒），默认1000ms
  maxWait?: number;         // 最大等待时间（毫秒），默认5000ms
  onDebounce?: () => void; // 防抖触发时的回调
}

/**
 * 防抖Hook
 * @param value 需要防抖的值
 * @param options 配置选项
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {
  const { delay = 1000, maxWait = 5000, onDebounce } = options;
  
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const valueRef = useRef<T>(value);

  useEffect(() => {
    valueRef.current = value;

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
    }

    // 设置防抖定时器
    timerRef.current = setTimeout(() => {
      setDebouncedValue(valueRef.current);
      if (onDebounce) {
        onDebounce();
      }
    }, delay);

    // 设置最大等待定时器
    maxWaitTimerRef.current = setTimeout(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setDebouncedValue(valueRef.current);
      if (onDebounce) {
        onDebounce();
      }
    }, maxWait);

    // 清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
      }
    };
  }, [value, delay, maxWait, onDebounce]);

  return debouncedValue;
}

// ============================================
// 自动保存Hook
// 当数据变化时自动调用保存API
// ============================================

interface UseAutoSaveOptions<T> {
  data: T;                      // 需要自动保存的数据
  onSave: (data: T) => Promise<void>; // 保存回调函数
  delay?: number;               // 防抖延迟（毫秒），默认2000ms
  maxWait?: number;              // 最大等待时间（毫秒），默认10000ms
  enabled?: boolean;             // 是否启用自动保存，默认true
}

/**
 * 自动保存Hook
 * @param options 配置选项
 * @returns 自动保存状态
 */
export function useAutoSave<T>(options: UseAutoSaveOptions<T>) {
  const { data, onSave, delay = 2000, maxWait = 10000, enabled = true } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 使用防抖Hook
  const debouncedData = useDebounce(data, {
    delay,
    maxWait,
    onDebounce: () => {
      if (enabled && hasChanges) {
        executeSave(debouncedData);
      }
    }
  });

  // 执行保存
  const executeSave = useCallback(async (dataToSave: T) => {
    if (!enabled) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(dataToSave);
      setLastSavedAt(new Date());
      setHasChanges(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [enabled, onSave]);

  // 手动触发保存
  const saveNow = useCallback(async () => {
    if (!hasChanges) return;
    await executeSave(data);
  }, [hasChanges, data, executeSave]);

  // 标记有变化
  const markAsChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  return {
    isSaving,
    lastSavedAt,
    saveError,
    hasChanges,
    saveNow,
    markAsChanged,
    debouncedData,
  };
}

export default useAutoSave;
