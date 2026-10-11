import { defineCustomElements } from '@ionic/core/loader';
defineCustomElements(window);

import '@ionic/core/css/core.css';
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';
import '@ionic/core/css/padding.css';
import '@ionic/core/css/flex-utils.css';
import '@ionic/core/css/display.css';
import './theme.css'

import { addIcons } from 'ionicons';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { mic, stop, search, trash, personCircle, folderOpenOutline } from 'ionicons/icons';
addIcons({ mic, stop, search, trash, personCircle, folderOpenOutline });

interface Note {
  id: number;
  text: string;
}

const KEY = 'notes';
let notes: Note[] = [];
let recording = false;
let editingId: number | null = null;

const btn = document.getElementById('record-btn') as HTMLIonButtonElement;
const label = document.getElementById('record-label')!;
const icon = btn.querySelector('ion-icon') as HTMLIonIconElement;
const live = document.getElementById('live-text')!;
const list = document.getElementById('notes-list')!;
const draft = document.getElementById('draft') as HTMLIonTextareaElement;

const modal = document.getElementById('note-modal') as HTMLIonModalElement;
modal.breakpoints = [0, 0.5, 0.9];
modal.initialBreakpoint = 0.9;
modal.presentingElement = document.getElementById('main-content')!;
let openNote: Note | null = null;

const segment = document.getElementById('view-segment') as HTMLIonSegmentElement;
const notesView = document.getElementById('notes-view')!;
const foldersView = document.getElementById('folders-view')!;

segment.addEventListener('ionChange', (ev: any) => {
  const value = ev.detail.value;
  notesView.classList.toggle('ion-hide', value !== 'notes');
  foldersView.classList.toggle('ion-hide', value !== 'folders');
});

async function editNote(n: Note) {
  editingId = n.id;
  draft.value = n.text;
  await document.querySelector('ion-content')!.scrollToTop(200);
  draft.setFocus();
}

function deleteNote(n: Note) {
  notes = notes.filter((x) => x.id !== n.id);
  save();
  render();
}

function openDetail(n: Note) {
  openNote = n;
  const firstLine = n.text.split(/[.!?\n]/)[0].trim();
  document.getElementById('detail-title')!.textContent =
    firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine;
  document.getElementById('detail-created')!.textContent = new Date(n.id).toLocaleString('et-EE');
  document.getElementById('detail-length')!.textContent = `${n.text.split(/\s+/).length} sõna`;
  document.getElementById('detail-text')!.textContent = n.text;
  modal.present();
}

document.getElementById('modal-back')!.addEventListener('click', () => modal.dismiss());
document.getElementById('detail-edit')!.addEventListener('click', async () => {
  await modal.dismiss();
  if (openNote) editNote(openNote);
});
document.getElementById('detail-delete')!.addEventListener('click', async () => {
  await modal.dismiss();
  if (openNote) deleteNote(openNote);
});

function render() {
  list.innerHTML = '';
  for (const n of notes) {
    const card = document.createElement('ion-card');
    card.className = 'note-card';
    card.addEventListener('click', () => openDetail(n));

    const content = document.createElement('ion-card-content');
    const date = document.createElement('ion-note');
    date.textContent = new Date(n.id).toLocaleDateString('et-EE', { day: '2-digit', month: 'short' });

    const text = document.createElement('p');
    text.textContent = n.text;
    const actions = document.createElement('div');
    actions.className = 'note-actions';
    const edit = document.createElement('ion-button');
    edit.setAttribute('fill', 'clear');
    edit.setAttribute('size', 'small');
    edit.textContent = 'Muuda';
    edit.addEventListener('click', (ev) => {
      ev.stopPropagation();
      editNote(n);
    });
    const del = document.createElement('ion-button');
    del.setAttribute('fill', 'clear');
    del.setAttribute('size', 'small');
    del.textContent = 'Kustuta';
    del.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deleteNote(n);
    });
    actions.append(edit, del);
    content.append(date, text, actions);
    card.append(content);
    list.appendChild(card);
  }
}
async function save() {
  await Preferences.set({ key: KEY, value: JSON.stringify(notes) });
}

function isNotes(x: unknown): x is Note[] {
  return Array.isArray(x) && x.every(
    (n) => typeof n?.id === 'number' && typeof n?.text === 'string'
  );
}

async function load() {
  const { value } = await Preferences.get({ key: KEY });
  try {
    const data: unknown = value ? JSON.parse(value) : [];
    notes = isNotes(data) ? data : [];
  } catch {
    notes = [];
  }
  render();
}

function setRecording(on: boolean) {
  recording = on;
  label.textContent = on ? 'Peata' : 'Räägi märkus';
  icon.name = on ? 'stop' : 'mic';
  btn.color = on ? 'danger' : 'primary';
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
  webRec.onend = () => setRecording(false);
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
  await SpeechRecognition.addListener('listeningState', (data) => {
    if (data.status === 'stopped') setRecording(false);
  });
  setRecording(true);
  try {
    await SpeechRecognition.start({
      language: 'et-EE',
      partialResults: true,
      popup: false,
    });
  } catch (e: any) {
    live.textContent = 'Viga: ' + (e?.message ?? e);
    setRecording(false);
  }
}

async function stopRecording() {
  setRecording(false);
  try {
    if (Capacitor.isNativePlatform()) {
      // Pluginaga stop() kutsel puudub resolve(), seega ei tohi seda lõputult oodata
      await Promise.race([
        SpeechRecognition.stop(),
        new Promise((resolve) => setTimeout(resolve, 500)),
      ]);
    } else {
      webRec?.stop();
    }
  } catch (e: any) {
    live.textContent = 'Viga: ' + (e?.message ?? e);
  }
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


