// Script pour générer des icônes placeholder
// Pour une app de production, remplacez ces images par vos propres icônes

const fs = require('fs');
const { createCanvas } = require('canvas');

const PRIMARY_COLOR = '#1A4BFF';
const sizes = [
  { name: 'icon.png', size: 1024 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 512 },
  { name: 'notification-icon.png', size: 96 },
  { name: 'favicon.png', size: 48 },
];

console.log('Pour générer les icônes, installez canvas: npm install canvas');
console.log('Puis exécutez ce script.');
console.log('\nOu créez manuellement ces fichiers avec les tailles indiquées:');
sizes.forEach(s => console.log(`  - ${s.name}: ${s.size}x${s.size}px`));
