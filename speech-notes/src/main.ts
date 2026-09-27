// Ionic init
(async () => {
  const ionicPath = '/ionic.esm.js';
  await import(/* @vite-ignore */ ionicPath);
})();

import '@ionic/core/css/core.css';
import '@ionic/core/css/normalize.css';
import '@ionic/core/css/structure.css';
import '@ionic/core/css/typography.css';
import '@ionic/core/css/padding.css';
import '@ionic/core/css/flex-utils.css';
import '@ionic/core/css/display.css';

import { addIcons } from 'ionicons';
import { mic } from 'ionicons/icons';
addIcons({ mic });

document.querySelector<HTMLElement>('ion-app')!.innerHTML = `
  <ion-header>
    <ion-toolbar>
      <ion-title>Speech Notes</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-button id="record-btn">
      <ion-icon slot="start" name="mic"></ion-icon>
      Räägi märkus
    </ion-button>
    <ion-list id="notes-list"></ion-list>
  </ion-content>
`;

//event listeners
