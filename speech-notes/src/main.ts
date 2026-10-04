import { defineCustomElements } from '@ionic/core/loader';
defineCustomElements(window);

import '@ionic/core/css/core.css';
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';
import '@ionic/core/css/padding.css';
import '@ionic/core/css/flex-utils.css';
import '@ionic/core/css/display.css';

import { addIcons } from 'ionicons';
import { mic, stop } from 'ionicons/icons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
addIcons({ mic, stop });

interface Note {
  id: number;
  text: string;
}

const KEY = 'notes';
let notes: Note[] = [];
let recording = false;
let editingId: number | null = null;

const btn = document.getElementById('record-btn') as HTMLElement;
const label = document.getElementById('record-label')!;
const icon = btn.querySelector('ion-icon')!;
const live = document.getElementById('live-text')!;
const list = document.getElementById('notes-list')!;
const draft = document.getElementById('draft') as HTMLIonTextareaElement;

function render() {
  list.innerHTML = '';
  for (const n of notes) {
    const item = document.createElement('ion-item');
    const l = document.createElement('ion-label');
    l.textContent = n.text;
    l.style.whiteSpace = 'normal';
    const edit = document.createElement('ion-button');
    edit.slot = 'end';
    edit.setAttribute('fill', 'clear');
    edit.textContent = 'Muuda';
    edit.addEventListener('click', async () => {
      editingId = n.id;
      draft.value = n.text;
      await document.querySelector('ion-content')!.scrollToTop(200);
      draft.setFocus();
    });
    const del = document.createElement('ion-button');
    del.slot = 'end';
    del.setAttribute('fill', 'clear');
    del.setAttribute('color', 'danger');
    del.textContent = 'Kustuta';
    del.addEventListener('click', () => {
      notes = notes.filter((x) => x.id !== n.id);
      save();
      render();
    });
    item.append(l, edit, del);
    list.appendChild(item);
  }
}

async function save() {
  await Preferences.set({ key: KEY, value: JSON.stringify(notes) });
}

async function load() {
  const { value } = await Preferences.get({ key: KEY });
  notes = value ? JSON.parse(value) : [];
  render();
}

function setRecording(on: boolean) {
  recording = on;
  label.textContent = on ? 'Peata' : 'Räägi märkus';
  icon.setAttribute('name', on ? 'stop' : 'mic');
}

// Brauseri Web Speech API (ainult testimiseks, Chrome/Edge)
let webRec: any = null;

function startWeb() {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) {
    live.textContent = 'Brauser ei toeta kõnetuvastust';
    return;
  }
  live.textContent = '';
  draft.value = '';
  editingId = null;
  webRec = new Ctor();
  webRec.lang = 'et-EE';
  webRec.continuous = true;
  webRec.interimResults = true;
  webRec.onresult = (e: any) => {
    draft.value = Array.from(e.results as ArrayLike<any>)
      .map((r) => r[0].transcript)
      .join(' ');
  };
  webRec.onerror = (e: any) => {
    live.textContent = 'Viga: ' + e.error;
    setRecording(false);
  };
  webRec.start();
  setRecording(true);
}

async function start() {
  if (!Capacitor.isNativePlatform()) return startWeb();
  const { available } = await SpeechRecognition.available();
  if (!available) {
    live.textContent = 'Kõnetuvastus pole saadaval';
    return;
  }
  const perm = await SpeechRecognition.requestPermissions();
  if (perm.speechRecognition !== 'granted') {
    live.textContent = 'Luba puudub';
    return;
  }
  live.textContent = '';
  draft.value = '';
  editingId = null;
  await SpeechRecognition.removeAllListeners();
  await SpeechRecognition.addListener('partialResults', (data) => {
    draft.value = data.matches?.[0] ?? '';
  });
  setRecording(true);
  await SpeechRecognition.start({
    language: 'et-EE',
    partialResults: true,
    popup: false,
  });
}

async function stopRecording() {
  if (Capacitor.isNativePlatform()) {
    await SpeechRecognition.stop();
    await SpeechRecognition.removeAllListeners();
  } else {
    webRec?.stop();
  }
  setRecording(false);
}

async function saveDraft() {
  const text = (draft.value ?? '').trim();
  if (!text) return;
  if (editingId !== null) {
    notes = notes.map((n) => (n.id === editingId ? { ...n, text } : n));
  } else {
    notes.unshift({ id: Date.now(), text });
  }
  editingId = null;
  draft.value = '';
  await save();
  render();
}

btn.addEventListener('click', () => (recording ? stopRecording() : start()));
document.getElementById('save-btn')!.addEventListener('click', saveDraft);
document.getElementById('cancel-btn')!.addEventListener('click', () => {
  editingId = null;
  draft.value = '';
});

document.getElementById('clear-btn')!.addEventListener('click', async () => {
  notes = [];
  await save();
  render();
});

load();
