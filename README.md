# KeyFlow Studio — Virtual Piano

Application desktop Electron permettant de jouer du piano au clavier PC, lire des fichiers MIDI (`.mid`) et envoyer le son directement dans un micro virtuel (Discord, OBS, etc.).

## Fonctionnalités

- **Mode Frappe Magique** : chaque touche pressée sur le clavier joue la note suivante de la partition chargée, avec suivi en temps réel sur la bande de notes.
- **Lecture MIDI & Auto-Play** : import de fichiers `.mid` via `@tonejs/midi` (supporte les partitions longues de plusieurs milliers de notes sans lag DOM).
- **Mode Split Streaming** : séparation du clavier et du panneau de contrôle dans deux fenêtres indépendantes (`src/piano-stream.html`) pour faciliter la capture sur OBS / Discord.
- **Routage micro virtuel** : compatible avec [VB-Cable](https://vb-audio.com/Cable/) pour rediriger la sortie audio vers un vocal.
- **Discord Rich Presence** : affichage du morceau en cours dans le statut Discord, avec un pont IPC local (`discordAdminBridge.js`) si Discord tourne en administrateur.

## Installation et lancement

Prérequis : Node.js (v18+).

```bash
git clone https://github.com/Nitrovinzleo/keyflow-virtual-piano.git
cd keyflow-virtual-piano
npm install
npm start
```

Sur Windows, `Lancer Virtual Piano.bat` permet aussi de démarrer l'application directement avec les droits nécessaires pour la détection IPC Discord.

## Organisation du projet

```text
├── main.js                   # Process principal Electron et gestion des fenêtres
├── preload.js                # Bridge IPC sécurisé
├── discordRpc.js             # Gestion du statut Discord Rich Presence
├── discordAdminBridge.js     # Relais TCP local <-> pipe Discord (mode admin)
├── src/                      # Interface, moteur audio et vue stream séparée
├── midi/                     # Fichiers .mid inclus pour tester
└── banque/                   # Ressources de la banque de morceaux
```

## Licence

MIT
