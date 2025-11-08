// ----- Firebase config (tu configuración) -----
const firebaseConfig = {
  apiKey: "AIzaSyCo_3ycT3KcobtKBfsTIvh0u-8zldvOyHE",
  authDomain: "inventariohogar-deab7.firebaseapp.com",
  databaseURL: "https://inventariohogar-deab7-default-rtdb.firebaseio.com",
  projectId: "inventariohogar-deab7",
  storageBucket: "inventariohogar-deab7.firebasestorage.app",
  messagingSenderId: "201686070076",
  appId: "1:201686070076:web:643f4298878bc2aa23e439",
  measurementId: "G-TNLB3DWKVV"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ----- Listas editables guardadas en localStorage -----
let listaProductos = JSON.parse(localStorage.getItem('listaProductos')) || ["Sandalia","Calceta","Zapato","Cinturón"];
let listaTallas = JSON.parse(localStorage.getItem('listaTallas')) || ["CH","M","G","24","25","26"];
function guardarListas() {
  localStorage.setItem('listaProductos', JSON.stringify(listaProductos));
  localStorage.setItem('listaTallas', JSON.stringify(listaTallas));
}

// ----- Mostrar/ocultar secciones (toggle) -----
function toggleInventario() {
  const sec = document.getElementById('inventarioSection');
  if (sec.style.display === 'block') {
    sec.style.display = 'none';
  } else {
    sec.style.display = 'block';
    mostrarInventario(); // recargar datos al mostrar
  }
}

function toggleMovimientos() {
  const sec = document.getElementById('movimientosSection');
  if (sec.style.display === 'block') {
    sec.style.display = 'none';
  } else {
    sec.style.display = 'block';
    mostrarMovimientos(); // recargar datos al mostrar
  }
}

// ----- Modal utilities -----
function abrirModal(tipo, opts = {}) {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  contenido.innerHTML = '';
  modal.style.display = 'flex';

  // botón cerrar en todas las modales
  const btnCerrarTop = document.createElement('div');
  btnCerrarTop.style.textAlign = 'right';
  const btnCerrar = document.createElement('button');
  btnCerrar.innerText = '❌ Cerrar';
  btnCerrar.onclick = cerrarModal;
  btnCerrarTop.appendChild(btnCerrar);
  contenido.appendChild(btnCerrarTop);

  if (tipo === 'producto') {
    const h = document.createElement('h3'); h.innerText = 'Selecciona un producto'; contenido.appendChild(h);
    listaProductos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerText = p;
      div.onclick = () => {
        document.getElementById('producto').value = p;
        cerrarModal();
        abrirModal('talla');
      };
      contenido.appendChild(div);
    });
    contenido.appendChild(document.createElement('hr'));
    const btnEdit = document.createElement('button');
    btnEdit.innerText = 'Editar productos';
    btnEdit.onclick = () => { cerrarModal(); abrirModalEditar('producto'); };
    contenido.appendChild(btnEdit);
  }
  else if (tipo === 'talla') {
    const h = document.createElement('h3'); h.innerText = 'Selecciona una talla'; contenido.appendChild(h);
    listaTallas.forEach(t => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerText = t;
      div.onclick = async () => {
        document.getElementById('talla').value = t;
        await autocompletarPreciosPorProductoTalla(); // autollenar precios con 2 decimales
        cerrarModal();
        abrirModalNumero('cantidad', {allowDecimal:false}); // seguir flujo
      };
      contenido.appendChild(div);
    });
    contenido.appendChild(document.createElement('hr'));
    const btnEdit2 = document.createElement('button');
    btnEdit2.innerText = 'Editar tallas';
    btnEdit2.onclick = () => { cerrarModal(); abrirModalEditar('talla'); };
    contenido.appendChild(btnEdit2);
  } else {
    contenido.innerHTML = '<p>Tipo no soportado</p>';
  }
}

function cerrarModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
}
window.onclick = (ev) => {
  const modal = document.getElementById('modal');
  if (ev.target === modal) cerrarModal();
};

// ----- Teclado numérico modal (cantidad / precios) -----
function abrirModalNumero(campoId, opts = {allowDecimal:false}) {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  modal.style.display = 'flex';

  const current = document.getElementById(campoId).value || '';
  contenido.innerHTML = `
    <div style="text-align:right;"><button id="btnCloseNum">❌ Cerrar</button></div>
    <h3>Ingresa valor</h3>
    <input id="valorTemp" type="text" readonly style="font-size:18px;padding:8px;width:90%;margin:8px 0;border-radius:6px;border:1px solid #ddd;" value="${current}" />
    <div class="keypad" id="keypadArea"></div>
    <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
      <button id="btnClear">⌫</button>
      <button id="btnConfirm">✔️ Aceptar</button>
      <button id="btnCancel">✖️ Cancelar</button>
    </div>
  `;

  document.getElementById('btnCloseNum').onclick = cerrarModal;

  const keypad = document.getElementById('keypadArea');
  for (let i=1;i<=9;i++){
    const b = document.createElement('button'); b.innerText = i; b.onclick = ()=> appendDigit(i.toString());
    keypad.appendChild(b);
  }
  const b0 = document.createElement('button'); b0.innerText = '0'; b0.onclick = ()=> appendDigit('0'); keypad.appendChild(b0);

  if (opts.allowDecimal) {
    const dp = document.createElement('button'); dp.innerText = '.'; dp.onclick = ()=> appendDecimal(); keypad.appendChild(dp);
  } else {
    const spacer = document.createElement('div'); spacer.style.height='0px'; keypad.appendChild(spacer);
  }

  document.getElementById('btnClear').onclick = ()=> {
    const el = document.getElementById('valorTemp'); el.value = el.value.slice(0,-1);
  };
  document.getElementById('btnCancel').onclick = ()=> cerrarModal();
  document.getElementById('btnConfirm').onclick = ()=> {
    const v = document.getElementById('valorTemp').value;
    if (v !== '') {
      if (campoId === 'precioCompra' || campoId === 'precioVenta') {
        const num = parseFloat(v) || 0;
        document.getElementById(campoId).value = num.toFixed(2);
      } else {
        document.getElementById(campoId).value = v;
      }
    }
    cerrarModal();
  };

  function appendDigit(d) {
    const el = document.getElementById('valorTemp');
    if (el.value === '0' && d !== '.') el.value = d;
    else el.value += d;
  }
  function appendDecimal() {
    const el = document.getElementById('valorTemp');
    if (!el.value.includes('.')) {
      if (el.value === '') el.value = '0.';
      else el.value += '.';
    }
  }
}

// ----- Editar listas (productos / tallas) -----
function abrirModalEditar(tipo) {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  modal.style.display = 'flex';
  contenido.innerHTML = '';
  const lista = tipo === 'producto' ? listaProductos : listaTallas;
  contenido.innerHTML = `<h3>Editar ${tipo === 'producto' ? 'Productos' : 'Tallas'}</h3>`;

  lista.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const span = document.createElement('span'); span.innerText = item;
    const actions = document.createElement('div');
    const btnDel = document.createElement('button'); btnDel.innerText = '❌'; btnDel.className='small';
    btnDel.onclick = ()=> {
      if (confirm('Eliminar "'+item+'"?')) {
        lista.splice(idx,1); guardarListas(); abrirModalEditar(tipo);
      }
    };
    actions.appendChild(btnDel);
    div.appendChild(span); div.appendChild(actions);
    contenido.appendChild(div);
  });

  contenido.appendChild(document.createElement('hr'));
  const inputNuevo = document.createElement('input'); inputNuevo.placeholder = tipo==='producto' ? 'Nuevo producto' : 'Nueva talla';
  inputNuevo.style.width = '70%'; inputNuevo.style.padding='8px';
  contenido.appendChild(inputNuevo);
  const btnAdd = document.createElement('button'); btnAdd.innerText = 'Agregar'; btnAdd.style.marginLeft='8px';
  btnAdd.onclick = ()=> {
    const val = inputNuevo.value.trim();
    if (!val) return alert('Ingresa un valor');
    if (lista.includes(val)) return alert('Ya existe');
    lista.push(val); guardarListas(); abrirModalEditar(tipo);
  };
  contenido.appendChild(btnAdd);

  contenido.appendChild(document.createElement('hr'));
  const btnCerrar = document.createElement('button'); btnCerrar.innerText='Cerrar'; btnCerrar.onclick = cerrarModal;
  contenido.appendChild(btnCerrar);
}

// ----- Autocompletar precios al seleccionar talla -----
async function autocompletarPreciosPorProductoTalla() {
  const producto = document.getElementById('producto').value.trim();
  const talla = document.getElementById('talla').value.trim();
  const precioCompraField = document.getElementById('precioCompra');
  const precioVentaField = document.getElementById('precioVenta');

  if (!producto || !talla) {
    precioCompraField.value = (0).toFixed(2);
    precioVentaField.value = (0).toFixed(2);
    return;
  }

  try {
    const id = `${producto}_${talla}`;
    const ref = db.collection('productos').doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      const data = doc.data();
      const pc = parseFloat(data.precioCompra) || 0;
      const pv = parseFloat(data.precioVenta) || 0;
      precioCompraField.value = pc.toFixed(2);
      precioVentaField.value = pv.toFixed(2);
    } else {
      precioCompraField.value = (0).toFixed(2);
      precioVentaField.value = (0).toFixed(2);
    }
  } catch (err) {
    console.error('Error autocompletar precios', err);
    precioCompraField.value = (0).toFixed(2);
    precioVentaField.value = (0).toFixed(2);
  }
}

// ----- Agregar (compra), vender, mostrar inventario / movimientos, resumen -----
async function agregarProducto() {
  const producto = document.getElementById('producto').value.trim();
  const talla = document.getElementById('talla').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value || '0');
  const precioCompra = parseFloat(document.getElementById('precioCompra').value || '0') || 0;
  const precioVenta = parseFloat(document.getElementById('precioVenta').value || '0') || 0;

  if (!producto || !talla || !cantidad || !precioCompra || !precioVenta) {
    return alert('⚠️ Por favor completa todos los campos (producto, talla, cantidad, precios).');
  }

  const id = `${producto}_${talla}`;
  const ref = db.collection('productos').doc(id);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({ cantidad: doc.data().cantidad + cantidad, precioCompra, precioVenta });
  } else {
    await ref.set({ producto, talla, cantidad, precioCompra, precioVenta });
  }

  await db.collection('movimientos').add({
    tipo: 'compra', producto, talla, cantidad, total: cantidad * precioCompra, fecha: new Date()
  });

  alert(`✅ Se agregaron ${cantidad} ${producto}(s) talla ${talla}`);
  // recargar si las secciones están visibles
  if (document.getElementById('inventarioSection').style.display === 'block') mostrarInventario();
  if (document.getElementById('movimientosSection').style.display === 'block') mostrarMovimientos();
}

async function venderProducto() {
  const producto = document.getElementById('producto').value.trim();
  const talla = document.getElementById('talla').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value || '0');

  if (!producto || !talla || !cantidad) return alert('⚠️ Completa producto, talla y cantidad.');

  const id = `${producto}_${talla}`;
  const ref = db.collection('productos').doc(id);
  const doc = await ref.get();

  if (doc.exists && doc.data().cantidad >= cantidad) {
    await ref.update({ cantidad: doc.data().cantidad - cantidad });

    const precioVenta = (doc.data().precioVenta !== undefined) ? parseFloat(doc.data().precioVenta) : (parseFloat(document.getElementById('precioVenta').value)||0);

    await db.collection('movimientos').add({
      tipo: 'venta', producto, talla, cantidad, total: cantidad * precioVenta, fecha: new Date()
    });

    alert(`💰 Venta registrada: ${cantidad} ${producto}(s) talla ${talla}`);
    if (document.getElementById('movimientosSection').style.display === 'block') mostrarMovimientos();
    if (document.getElementById('inventarioSection').style.display === 'block') mostrarInventario();
  } else {
    alert('❌ No hay suficiente inventario para vender.');
  }
}

async function mostrarInventario() {
  const tabla = document.querySelector('#tablaInventario tbody'); tabla.innerHTML = '';
  let totalInvertido = 0;
  try {
    const snapshot = await db.collection('productos').get();
    snapshot.forEach(doc => {
      const p = doc.data();
      const row = tabla.insertRow();
      row.innerHTML = `
        <td>${p.producto}</td>
        <td>${p.talla}</td>
        <td>${p.cantidad}</td>
        <td>$${(p.precioCompra||0).toFixed(2)}</td>
        <td>$${(p.precioVenta||0).toFixed(2)}</td>
        <td>$${((p.precioCompra||0) * (p.cantidad||0)).toFixed(2)}</td>
      `;
      totalInvertido += (p.precioCompra||0) * (p.cantidad||0);
    });
    document.getElementById('totalInvertido').innerText = `Total invertido: $${totalInvertido.toFixed(2)}`;
    calcularResumen();
  } catch (e) {
    console.error('mostrarInventario err', e);
  }
}

async function mostrarMovimientos() {
  const tabla = document.querySelector('#tablaMovimientos tbody'); tabla.innerHTML = '';
  try {
    const snapshot = await db.collection('movimientos').orderBy('fecha','desc').get();
    snapshot.forEach(doc => {
      const m = doc.data();
      const fila = tabla.insertRow();
      let fechaText = '';
      try {
        fechaText = m.fecha && m.fecha.toDate ? new Date(m.fecha.toDate()).toLocaleString() : new Date(m.fecha).toLocaleString();
      } catch (e) {
        fechaText = new Date().toLocaleString();
      }
      fila.innerHTML = `
        <td>${m.tipo}</td>
        <td>${m.producto}</td>
        <td>${m.talla}</td>
        <td>${m.cantidad}</td>
        <td>${m.total ? '$' + (m.total).toFixed(2) : '-'}</td>
        <td>${fechaText}</td>
      `;
    });
    calcularResumen();
  } catch (e) {
    console.error('mostrarMovimientos err', e);
  }
}

async function calcularResumen() {
  let totalInvertido = 0;
  let totalVendido = 0;
  try {
    const inv = await db.collection('productos').get();
    inv.forEach(doc => totalInvertido += (doc.data().precioCompra||0) * (doc.data().cantidad||0));
    const ventas = await db.collection('movimientos').where('tipo','==','venta').get();
    ventas.forEach(doc => totalVendido += (doc.data().total||0));
  } catch (e) {
    console.error('calcularResumen err', e);
  }
  document.getElementById('totalInvertido').innerText = `Total invertido: $${totalInvertido.toFixed(2)}`;
  document.getElementById('totalVendido').innerText = `Total vendido: $${totalVendido.toFixed(2)}`;
  document.getElementById('utilidad').innerText = `Utilidad: $${(totalVendido - totalInvertido).toFixed(2)}`;
}

// ----- Botón "Actualizar datos" -----
function actualizarDatos() {
  // recarga tablas visibles y el resumen sin recargar la página
  if (document.getElementById('inventarioSection').style.display === 'block') mostrarInventario();
  if (document.getElementById('movimientosSection').style.display === 'block') mostrarMovimientos();
  calcularResumen();
  // pequeña confirmación, no obligatorio
  // alert('Datos actualizados');
}

// ----- Voz (simple) -----
/*
function activarVoz() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    return alert('Reconocimiento de voz no disponible en este navegador.');
  }
  const Recon = window.SpeechRecognition || window.webkitSpeechRecognition;
  const r = new Recon();
  r.lang = 'es-ES'; r.interimResults = false; r.maxAlternatives = 1;
  r.start();
  r.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase();
    alert('🎧 Comando detectado: ' + texto);
    if (texto.includes('vender') && texto.includes('sandalia')) {
      document.getElementById('producto').value = 'Sandalia';
      const m = texto.match(/talla\s*([0-9]+|ch|m|g)/i);
      if (m) document.getElementById('talla').value = m[1];
      document.getElementById('cantidad').value = '1';
      venderProducto();
    }
  };
  r.onerror = (err) => console.error('voice err', err);
}
*/
function toggleResumen() {
  const resumen = document.getElementById('resumen');
  if (resumen.style.display === 'none' || resumen.style.display === '') {
    resumen.style.display = 'block';
  } else {
    resumen.style.display = 'none';
  }
}


// ----- Inicialización -----
window.addEventListener('load', () => {
  guardarListas();
  // ocultar secciones por defecto
  document.getElementById('inventarioSection').style.display = 'none';
  document.getElementById('movimientosSection').style.display = 'none';
  // precargar resumen
  calcularResumen();
});

// ----- exportar funciones útiles al scope global (opcional) -----
window.abrirModal = abrirModal;
window.abrirModalNumero = abrirModalNumero;
window.abrirModalEditar = abrirModalEditar;
window.cerrarModal = cerrarModal;
window.toggleInventario = toggleInventario;
window.toggleMovimientos = toggleMovimientos;
window.actualizarDatos = actualizarDatos;
