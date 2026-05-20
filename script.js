// Estado global de la aplicación
const DB_KEY = 'biblioteca_libros';

function getLibros() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } catch { return []; }
}

function saveLibros(libros) {
  localStorage.setItem(DB_KEY, JSON.stringify(libros));
  updateHeaderStats();
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// PANELS
function showPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.querySelector(`nav button[onclick="showPanel('${name}')"]`).classList.add('active');
  document.getElementById('fab').style.display = name === 'lista' ? 'flex' : 'none';
  if (name === 'stats') renderStats();
  if (name === 'lista') renderLista();
}

// HEADER STATS
function updateHeaderStats() {
  const libros = getLibros();
  const temas = new Set(libros.map(l => l.tema).filter(Boolean)).size;
  document.getElementById('headerStats').innerHTML =
    `${libros.length} libros · ${temas} temas`;
}

// RENDER LISTA
function renderLista() {
  const libros = getLibros();
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const tema = document.getElementById('filterTema').value;
  const ubic = document.getElementById('filterUbicacion').value;

  // Populate filters
  const temas = [...new Set(libros.map(l => l.tema).filter(Boolean))].sort();
  const ubicaciones = [...new Set(libros.map(l => l.ubicacion).filter(Boolean))].sort();

  const fTema = document.getElementById('filterTema');
  const fUbic = document.getElementById('filterUbicacion');
  const curTema = fTema.value;
  const curUbic = fUbic.value;

  fTema.innerHTML = '<option value="">Todos los temas</option>' +
    temas.map(t => `<option value="${t}" ${t===curTema?'selected':''}>${t}</option>`).join('');
  fUbic.innerHTML = '<option value="">Todas las ubicaciones</option>' +
    ubicaciones.map(u => `<option value="${u}" ${u===curUbic?'selected':''}>${u}</option>`).join('');

  let filtered = libros.filter(l => {
    const matchQ = !q || [l.titulo, l.autor, l.tema, l.editorial, l.notas].some(f => f && f.toLowerCase().includes(q));
    const matchTema = !tema || l.tema === tema;
    const matchUbic = !ubic || l.ubicacion === ubic;
    return matchQ && matchTema && matchUbic;
  });

  filtered.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es'));

  const list = document.getElementById('bookList');
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📖</div><p>${libros.length ? 'Sin resultados para esta búsqueda' : 'Aún no hay libros. Pulsa + para añadir el primero.'}</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(l => `
    <div class="book-card" onclick="verLibro('${l.id}')">
      <div class="titulo">${esc(l.titulo)}</div>
      <div class="autor">${esc(l.autor || '—')}</div>
      <div class="meta">
        ${l.tema ? `<span class="tag tag-tema">${esc(l.tema)}</span>` : ''}
        ${l.ubicacion ? `<span class="tag tag-ubicacion">📍 ${esc(l.ubicacion)}</span>` : ''}
        ${l.estante ? `<span class="tag tag-estante">Est. ${esc(l.estante)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// DETAIL MODAL
function verLibro(id) {
  const libros = getLibros();
  const l = libros.find(x => x.id === id);
  if (!l) return;

  document.getElementById('mTitulo').textContent = l.titulo;
  document.getElementById('mAutor').textContent = l.autor || '';

  const fields = [
    ['Editorial', l.editorial],
    ['Año', l.anio],
    ['Tema', l.tema],
    ['Nacionalidad', l.nacionalidad],
    ['Ubicación', l.ubicacion],
    ['Estante', l.estante],
    ['Fecha compra', l.fechaCompra],
  ].filter(([,v]) => v);

  document.getElementById('mGrid').innerHTML = fields.map(([label, val]) =>
    `<div class="detail-item"><label>${label}</label><span>${esc(val)}</span></div>`
  ).join('');

  const notasDiv = document.getElementById('mNotas');
  if (l.notas) {
    notasDiv.style.display = 'block';
    document.getElementById('mNotasText').textContent = l.notas;
  } else {
    notasDiv.style.display = 'none';
  }

  document.getElementById('mEditBtn').onclick = () => { cerrarModalBtn(); editarLibro(id); };
  document.getElementById('mDelBtn').onclick = () => eliminarLibro(id);

  document.getElementById('modalOverlay').classList.add('open');
}

function cerrarModal(e) {
  if (e.target === document.getElementById('modalOverlay')) cerrarModalBtn();
}
function cerrarModalBtn() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// FORM
function nuevoLibro() {
  limpiarFormulario();
  showPanel('alta');
}

function limpiarFormulario() {
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'Nuevo Libro';
  ['fTitulo','fAutor','fEditorial','fAnio','fTema','fNacionalidad','fUbicacion','fEstante','fFechaCompra','fNotas']
    .forEach(id => document.getElementById(id).value = '');
}

function editarLibro(id) {
  const l = getLibros().find(x => x.id === id);
  if (!l) return;
  showPanel('alta');
  document.getElementById('editId').value = id;
  document.getElementById('formTitle').textContent = 'Editar Libro';
  document.getElementById('fTitulo').value = l.titulo || '';
  document.getElementById('fAutor').value = l.autor || '';
  document.getElementById('fEditorial').value = l.editorial || '';
  document.getElementById('fAnio').value = l.anio || '';
  document.getElementById('fTema').value = l.tema || '';
  document.getElementById('fNacionalidad').value = l.nacionalidad || '';
  document.getElementById('fUbicacion').value = l.ubicacion || '';
  document.getElementById('fEstante').value = l.estante || '';
  document.getElementById('fFechaCompra').value = l.fechaCompra || '';
  document.getElementById('fNotas').value = l.notas || '';
}

function abrirCamara(modo) {
  const input = document.getElementById('cameraInput');
  if (modo === 'environment') {
    input.setAttribute('capture', 'environment');
  } else {
    input.removeAttribute('capture');
  }
  input.click();
}

async function escanearLibro(input) {
  const file = input.files[0];
  if (!file) return;

  // Show preview
  const preview = document.getElementById('scanPreview');
  preview.style.display = 'block';
  preview.src = URL.createObjectURL(file);

  const btn = document.getElementById('scanBtn');
  const status = document.getElementById('scanStatus');
  btn.disabled = true;
  btn.textContent = '⏳ Analizando imagen...';
  status.textContent = 'La IA está leyendo los datos del libro...';

  // Compress image before sending (max 1200px, quality 0.8)
  const base64 = await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      res(canvas.toDataURL('image/jpeg', 0.82).split(',')[1]);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });

  const mediaType = 'image/jpeg';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            {
              type: 'text',
              text: `Analiza esta imagen de un libro y extrae la información bibliográfica. Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown, con estos campos exactos:
{
  "titulo": "título del libro en mayúsculas tal como aparece",
  "autor": "nombre del autor tal como aparece",
  "editorial": "nombre de la editorial si aparece, sino cadena vacía",
  "anio": "año de publicación si aparece como número, sino cadena vacía",
  "coleccion": "nombre de colección o subtítulo entre paréntesis si hay, sino cadena vacía"
}
Si no puedes identificar claramente algún campo, déjalo como cadena vacía. No inventes datos.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log('API response:', JSON.stringify(data));
    if (data.error) throw new Error('API: ' + data.error.message);
    const text = data.content?.map(c => c.text || '').join('') || '';
    console.log('Text extracted:', text);
    const clean = text.replace(/```json|```/g, '').trim();
    const libro = JSON.parse(clean);
    console.log('Parsed libro:', libro);

    // Fill form fields
    if (libro.titulo) document.getElementById('fTitulo').value = libro.titulo;
    if (libro.autor) document.getElementById('fAutor').value = libro.autor;
    if (libro.editorial) document.getElementById('fEditorial').value = libro.editorial;
    if (libro.anio) document.getElementById('fAnio').value = libro.anio;
    if (libro.coleccion) {
      const notas = document.getElementById('fNotas');
      notas.value = notas.value ? notas.value + '\n' + libro.coleccion : libro.coleccion;
    }

    status.textContent = '✅ Datos extraídos. Revisa y completa los campos.';
    status.style.color = 'var(--sage)';
  } catch (err) {
    console.error(err);
    console.error('Error detallado:', err);
    status.textContent = '❌ Error: ' + err.message;
    status.style.color = 'var(--rust)';
  }

  btn.disabled = false;
  btn.innerHTML = '📷 Escanear otra portada';
  input.value = '';
}

function guardarLibro() {
  const titulo = document.getElementById('fTitulo').value.trim();
  const autor = document.getElementById('fAutor').value.trim();
  if (!titulo) { toast('El título es obligatorio'); return; }

  const libros = getLibros();
  const editId = document.getElementById('editId').value;

  const libro = {
    id: editId || genId(),
    titulo,
    autor,
    editorial: document.getElementById('fEditorial').value.trim(),
    anio: document.getElementById('fAnio').value.trim(),
    tema: document.getElementById('fTema').value.trim(),
    nacionalidad: document.getElementById('fNacionalidad').value.trim(),
    ubicacion: document.getElementById('fUbicacion').value.trim(),
    estante: document.getElementById('fEstante').value.trim(),
    fechaCompra: document.getElementById('fFechaCompra').value,
    notas: document.getElementById('fNotas').value.trim(),
  };

  if (editId) {
    const idx = libros.findIndex(x => x.id === editId);
    if (idx >= 0) libros[idx] = libro;
    toast('Libro actualizado ✓');
  } else {
    libros.push(libro);
    toast('Libro añadido ✓');
  }

  saveLibros(libros);
  limpiarFormulario();
  showPanel('lista');
}

function eliminarLibro(id) {
  if (!confirm('¿Eliminar este libro?')) return;
  const libros = getLibros().filter(x => x.id !== id);
  saveLibros(libros);
  cerrarModalBtn();
  renderLista();
  toast('Libro eliminado');
}

// STATS
function renderStats() {
  const libros = getLibros();

  const autores = new Set(libros.map(l => l.autor).filter(Boolean)).size;
  const temas = new Set(libros.map(l => l.tema).filter(Boolean)).size;
  const editoriales = new Set(libros.map(l => l.editorial).filter(Boolean)).size;
  const ubicaciones = new Set(libros.map(l => l.ubicacion).filter(Boolean)).size;

  document.getElementById('statsGrid').innerHTML = [
    [libros.length, 'Libros'],
    [autores, 'Autores'],
    [temas, 'Temas'],
    [ubicaciones, 'Ubicaciones'],
  ].map(([n, l]) => `<div class="stat-card"><span class="num">${n}</span><span class="lbl">${l}</span></div>`).join('');

  renderBarChart('chartTema', libros, 'tema', 10);
  renderBarChart('chartUbicacion', libros, 'ubicacion', 8);
  renderBarChart('chartAutor', libros, 'autor', 10);
}

function renderBarChart(elId, libros, campo, top) {
  const counts = {};
  libros.forEach(l => { if (l[campo]) counts[l[campo]] = (counts[l[campo]] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, top);
  const max = sorted[0]?.[1] || 1;
  document.getElementById(elId).innerHTML = sorted.length
    ? sorted.map(([k, v]) => `
        <div class="bar-row">
          <span class="bar-label" title="${esc(k)}">${esc(k)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(v/max*100).toFixed(1)}%"></div></div>
          <span class="bar-count">${v}</span>
        </div>`).join('')
    : '<p style="font-size:0.82rem; color:rgba(26,18,8,0.4)">Sin datos</p>';
}

// IMPORT / EXPORT
function importarCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (!lines.length) { toast('Archivo vacío'); return; }

    const sep = lines[0].includes(';') ? ';' : ',';
    const firstCols = parseCSVLine(lines[0], sep);
    // Si la primera columna tiene "TITULO" es CSV con cabecera; si es un número es TXT de Access sin cabecera
    const hasHeader = firstCols.some(c => c.toUpperCase().includes('TITULO'));

    const libros = getLibros();
    let added = 0;

    if (hasHeader) {
      // CSV con cabecera
      const headers = firstCols.map(h => h.toUpperCase());
      const idx = h => headers.indexOf(h);
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], sep);
        const titulo = cols[idx('TITULO')]?.trim();
        if (!titulo) continue;
        libros.push({
          id: genId(), titulo,
          autor: cols[idx('AUTOR')]?.trim() || '',
          editorial: cols[idx('EDITORIAL')]?.trim() || '',
          anio: (cols[idx('ANIO')] || cols[idx('AÑO')] || '').trim(),
          tema: cols[idx('TEMA')]?.trim() || '',
          nacionalidad: cols[idx('NACIONALIDAD')]?.trim() || '',
          ubicacion: cols[idx('UBICACION')]?.trim() || '',
          estante: cols[idx('ESTANTE')]?.trim() || '',
          fechaCompra: cols[idx('FECHACOMPRA')]?.trim() || '',
          notas: cols[idx('NOTAS')]?.trim() || '',
        });
        added++;
      }
    } else {
      // TXT sin cabecera exportado desde Access
      // col: 0=CODIGO, 1=TITULO, 2=AUTOR, 3=EDITORIAL, 4=NACIONALIDAD,
      //      5=vacío, 6=TEMA, 7=vacío, 8=UBICACION, 9=ESTANTE, 10=NOTAS
      for (let i = 0; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], sep);
        const titulo = cols[1]?.trim();
        if (!titulo) continue;
        libros.push({
          id: genId(), titulo,
          autor: cols[2]?.trim() || '',
          editorial: cols[3]?.trim() || '',
          anio: '',
          tema: cols[6]?.trim() || '',
          nacionalidad: cols[4]?.trim() || '',
          ubicacion: cols[8]?.trim() || '',
          estante: cols[9]?.trim() || '',
          fechaCompra: '',
          notas: cols[10]?.trim() || '',
        });
        added++;
      }
    }

    saveLibros(libros);
    renderLista();
    toast(`${added} libros importados ✓`);
    input.value = '';
  };
  reader.readAsText(file, 'ISO-8859-1');
}

function parseCSVLine(line, sep = ',') {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === sep && !inQ) { result.push(cur); cur = ''; }
    else { cur += c; }
  }
  result.push(cur);
  return result.map(s => s.replace(/"/g,'').trim());
}

function exportarCSV() {
  const libros = getLibros();
  if (!libros.length) { toast('No hay libros para exportar'); return; }
  const headers = ['TITULO','AUTOR','EDITORIAL','ANIO','TEMA','NACIONALIDAD','UBICACION','ESTANTE','FECHACOMPRA','NOTAS'];
  const rows = libros.map(l => [l.titulo,l.autor,l.editorial,l.anio,l.tema,l.nacionalidad,l.ubicacion,l.estante,l.fechaCompra,l.notas]
    .map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  descargar(csv, 'biblioteca.csv', 'text/csv');
  toast('CSV exportado ✓');
}

function exportarJSON() {
  const libros = getLibros();
  descargar(JSON.stringify(libros, null, 2), 'biblioteca.json', 'application/json');
  toast('JSON exportado ✓');
}

function descargar(contenido, nombre, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], {type: tipo}));
  a.download = nombre;
  a.click();
}

function borrarTodo() {
  if (!confirm('¿Borrar TODOS los libros? Esta acción no se puede deshacer.')) return;
  saveLibros([]);
  renderLista();
  toast('Datos borrados');
}

// INIT
updateHeaderStats();
renderLista();
