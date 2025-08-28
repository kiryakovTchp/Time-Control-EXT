import './ipc'; // регистрирует обработчики
import { init } from './timerEngine';

// Инициализируем таймер при старте сервис-воркера
init();

// Синхронизируем при перезапуске
chrome.runtime.onStartup.addListener(() => {
  init();
});

chrome.runtime.onInstalled.addListener(() => {
  init();
});
