// Mapeo de las mallas del modelo anatómico (body.glb, Z-Anatomy) a las zonas
// de BODY_PARTS (entities.js).
//
// Convenciones del modelo (verificadas sobre el .glb):
//   - La geometría de cada malla ya está en espacio mundial (los nodos de malla
//     tienen transformación identidad). El centroide de su caja = posición real.
//   - El cuerpo mira hacia +Z (frontal = +Z), +Y arriba, altura ~0 a ~1.65 m.
//   - Lados: -X = derecho, +X = izquierdo. Los pares siempre tienen X opuesto,
//     pero el sufijo del nombre (.001/.002/.003) NO es fiable para saber el
//     lado, así que el lado se deduce del signo de X.
//   - Cada malla lleva el nombre del nodo (p. ej. "Femur.003", "Gluteus maximus
//     muscle", "Costal cartilage of first rib").
//
// La clasificación usa el nombre de la malla y su centroide (x, y, z).

const RX = {
  // Zonas del eje central primero (más específicas)
  ojos: /(medial|lateral|superior|inferior) rectus muscle|orbicularis oculi|palpebrae|tarsus|tendinous ring|trochlea|superior oblique muscle|inferior oblique muscle/,
  garganta: /pharyngeal constrictor|arytenoid|ary-epiglottic|thyro-arytenoid|cricothyroid|crico-arytenoid|thyroid cartilage|cricoid cartilage|corniculate|stylopharyngeus|palatopharyngeus/,
  cuello: /vertebra c\d|atlas|axis|hyoid bone|sternocleidomastoid|scalenus|longus colli|longus capitis|capitis|digastric|stylohyoid|mylohyoid|geniohyoid|genioglossus|hyoglossus|omohyoid|sternohyoid|sternothyroid|thyrohyoid|levator scapulae|platysma|interspinales colli|multifidus colli|iliocostalis colli|longissimus colli|semispinalis colli|spinalis colli|splenius/,
  pecho: /sternum|xiphoid|rib|costal cartilage|intercostal|pectoralis|transversus thoracis|serratus anterior|diaphragm|subclavius/,
  abdomen: /rectus abdominis|abdominal oblique|transversus abdominis|linea alba|pyramidalis/,
  espalda: /latissimus|trapezius|rhomboid|iliocostalis thoracis|longissimus thoracis|spinalis thoracis|multifidus thoracis|semispinalis thoracis|serratus posterior|interspinales thoracis|rotatores|levatores|vertebra t\d/,
  'espalda-baja': /vertebra l\d|multifidus lumborum|iliocostalis lumborum|interspinales lumborum|intertransversarii|quadratus lumborum/,
  cadera: /gluteus|gluteal|piriformis|obturator|gemellus|quadratus femoris|iliacus|psoas|hip bone|sacrum|coccyx|trochanteric|sciatic|iliopectineal/,
  // Zonas pareadas (reciben sufijo -izq/-der según el signo de X)
  hombro: /deltoid|supraspinatus|infraspinatus|teres major|teres minor|subscapularis|clavicle|scapula|acromial|subdeltoid|subacromial|intertubercular|coracobrachial bursa/,
  brazo: /humerus|biceps brachii|triceps brachii|brachialis|coracobrachialis muscle/,
  codo: /anconeus|bicipitoradial|subtendinous bursa of triceps|supinator|brachioradialis|pronator teres/,
  antebrazo: /radius|ulna|carpi radialis|carpi ulnaris|pronator quadratus|palmaris longus|flexor digitorum profundus|flexor digitorum superficialis|flexor pollicis longus|extensor pollicis|extensor indicis|extensor digiti minimi|extensor carpi|flexor carpi|abductor pollicis longus/,
  mano: /scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|finger of hand|of hand|interossei|lumbrical|opponens|pollicis brevis|adductor pollicis|abductor pollicis brevis|digiti minimi/,
  muslo: /femur|rectus femoris|vastus|adductor|long head of biceps femoris|short head of biceps femoris|semitendinosus muscle|semimembranosus muscle|sartorius|gracilis|pectineus/,
  rodilla: /patella|popliteus|prepatellar|infrapatellar|suprapatellar|anserine bursa|semimembranosus bursa|subtendinous bursa of gastrocnemius/,
  pierna: /tibia|fibula|head of gastrocnemius|soleus|plantaris|tibialis|fibularis|flexor digitorum longus|flexor hallucis longus|extensor digitorum longus|extensor hallucis longus/,
  pie: /talus|calcaneus|navicular|cuboid|cuneiform|metatarsal|phalanx of.*foot|hallucis brevis|abductor hallucis|adductor hallucis|sesamoid|malleolus|plantar/,
};

const KEYWORD_ZONES = [
  'pecho',
  'abdomen',
  'espalda',
  'espalda-baja',
  'cadera',
  'hombro',
  'brazo',
  'codo',
  'antebrazo',
  'mano',
  'rodilla',
  'muslo',
  'pierna',
  'pie',
];

const PAIRED = new Set(['hombro', 'brazo', 'codo', 'antebrazo', 'mano', 'muslo', 'rodilla', 'pierna', 'pie']);

// Devuelve el id de zona de BODY_PARTS para una malla (incluido sufijo -izq/-der).
export function getBodyZone(name, x, y, z) {
  const n = name.toLowerCase();
  if (RX.ojos.test(n)) return 'ojos';
  if (RX.garganta.test(n)) return 'garganta';
  if (RX.cuello.test(n)) return 'cuello';
  if (y > 1.5) return 'cabeza';
  for (const k of KEYWORD_ZONES) {
    if (RX[k].test(n)) return k;
  }
  const ax = Math.abs(x);
  if (y < 0.12) return 'pie';
  if (y < 0.36) return 'pierna';
  if (y < 0.53) return 'rodilla';
  if (y < 0.72) return 'muslo';
  if (ax > 0.08) {
    if (y > 1.25) return 'hombro';
    if (y > 1.13) return 'brazo';
    if (y > 1.0) return 'codo';
    if (y > 0.86) return 'antebrazo';
    return 'mano';
  }
  if (y >= 1.12) return z > 0 ? 'pecho' : 'espalda';
  if (y >= 0.95) return z > 0 ? 'abdomen' : 'espalda-baja';
  return 'cadera';
}

// Como getBodyZone pero añade el sufijo de lado para las zonas pareadas.
export function getBodyZoneId(name, x, y, z) {
  const zone = getBodyZone(name, x, y, z);
  return PAIRED.has(zone) ? `${zone}${x > 0 ? '-izq' : '-der'}` : zone;
}

// ---------------------------------------------------------------------------
// Zonas finas (modo "Detalle" del cuerpo 3D). Subdividen algunas zonas de
// BODY_PARTS usando nombres anatómicos y bandas de coordenadas verificadas
// sobre las 826 mallas del modelo. Devuelve null cuando no hay subzona y el
// llamador debe quedarse con la zona gruesa (coarse).
// ---------------------------------------------------------------------------

const RX_DETAIL = {
  cuero: /occipitalis muscle|epicranial aponeurosis|temporoparietalis muscle/,
  frente: /frontalis muscle|frontal bone|corrugator supercilii|procerus muscle/,
  sienes: /temporalis muscle|temporal bone/,
  ojos: /rectus muscle|oblique muscle|orbicularis oculi|tarsus|trochlea|levator palpebrae|lacrimal bone|common tendinous ring/,
  nariz: /nasal|vomer|ethmoid bone|levator nasolabialis|nasalis muscle|alar cartilage/,
  mejilla: /bucinator|zygomaticus|risorius muscle|zygomatic bone|maxilla|levator anguli oris|levator labii superioris/,
  boca: /orbicularis oris|depressor anguli oris|depressor labii inferioris|tooth|canine|incisor|molar|premolar|palatine bone/,
  mandibula: /mandible|masseter|pterygoid/,
  menton: /mentalis muscle/,
  oreja: /incus|malleus|stapes/,
  muneca: /scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate|tendon sheath of flexor carpi radialis|tendon sheath of extensor carpi|common flexor tendon sheath|tendon sheath of extensor digiti minimi|tendon sheath of extensor pollicis longus|tendon sheath of flexor pollicis longus|tendon sheath of extensor digitorum and extensor indicis|tendon sheath - abd/,
  palma: /metacarpal|pollicis brevis|opponens pollicis|adductor pollicis|abductor pollicis brevis|digiti minimi.*of hand|lumbrical muscles of hand|palmar interossei|dorsal interossei/,
  dedos: /phalanx of .* finger of hand|synovial sheaths of digits of hand|cruciform part of fibrous sheath of digit of hand/,
  tobillo: /talus|malleolus|tendon sheath of tibialis anterior|tendon sheath of extensor hallucis longus|tendon sheath of extensor digitorum longus|tendon sheath of flexor hallucis longus|tendon sheath of flexor digitorum longus|tendon sheath of tibialis posterior|common tendon sheath of fibularis/,
  talon: /calcaneus|calcaneal bursa/,
  empeine: /metatarsal|navicular|cuboid|cuneiform/,
  planta: /plantar|sesamoid/,
  dedosPie: /phalanx of .* finger of foot/,
};

const backFineZone = (y) => {
  if (y >= 1.38) return 'espalda-cervical';
  if (y >= 1.3) return 'espalda-toracica-alta';
  if (y >= 1.2) return 'espalda-toracica-media';
  return 'espalda-toracica-baja';
};

// Devuelve el id fino de una malla en modo Detalle, o null para usar el grueso.
export function getBodyZoneDetail(name, x, y, z, coarse) {
  const n = name.toLowerCase();
  const side = x > 0 ? '-izq' : '-der';

  if (coarse === 'ojos') return `ojos${side}`;

  if (coarse === 'cabeza') {
    if (RX_DETAIL.cuero.test(n)) return 'cuero-cabelludo';
    if (RX_DETAIL.ojos.test(n)) return `ojos${side}`;
    if (RX_DETAIL.frente.test(n)) return 'frente';
    if (RX_DETAIL.sienes.test(n)) return `sienes${side}`;
    if (RX_DETAIL.nariz.test(n)) return 'nariz';
    if (RX_DETAIL.mejilla.test(n)) return `mejilla${side}`;
    if (RX_DETAIL.boca.test(n)) return 'boca';
    if (RX_DETAIL.mandibula.test(n)) return 'mandibula';
    if (RX_DETAIL.menton.test(n)) return 'menton';
    if (RX_DETAIL.oreja.test(n)) return `oreja${side}`;
    return null;
  }

  if (coarse === 'espalda') return backFineZone(y);

  if (coarse === 'mano-izq' || coarse === 'mano-der') {
    if (RX_DETAIL.dedos.test(n)) return `dedos-mano${side}`;
    if (RX_DETAIL.muneca.test(n)) return `muneca${side}`;
    if (RX_DETAIL.palma.test(n)) return `palma${side}`;
    return null;
  }

  // El tobillo/tendones del pie (y<0.12) pueden caer en "pierna" por el regex
  // /tibialis|fibularis/; aquí se reclasifican como zonas finas del pie.
  if (coarse === 'pie-izq' || coarse === 'pie-der' || (coarse === 'pierna-izq' || coarse === 'pierna-der') && y < 0.12) {
    if (RX_DETAIL.dedosPie.test(n)) return `dedos-pie${side}`;
    if (RX_DETAIL.talon.test(n)) return `talon${side}`;
    if (RX_DETAIL.tobillo.test(n)) return `tobillo${side}`;
    if (RX_DETAIL.empeine.test(n)) return `empeine${side}`;
    if (RX_DETAIL.planta.test(n)) return `planta${side}`;
    return null;
  }

  return null;
}

// Región abdominal fina a partir del centroide de un triángulo. Se usa en
// Body3D para partir las mallas del abdomen (recto, oblicuos, transverso,
// línea alba, piramidal) y evitar zonas vacías en epigastrio/hipogastrio.
export function abdomenRegion(x, y) {
  const side = x > 0 ? '-izq' : '-der';
  if (Math.abs(x) >= 0.05) return y >= 1.03 ? `hipocondrio${side}` : `fosa-iliaca${side}`;
  if (y >= 1.06) return 'epigastrio';
  if (y >= 1.0) return 'mesogastrio';
  return 'hipogastrio';
}
