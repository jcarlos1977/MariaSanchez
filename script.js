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

// ----- Listas locales -----
let listaProductos = JSON.parse(localStorage.getItem('listaProductos')) || ["Sandalia","Calceta","Zapato","Cinturón"];
let listaTallas = JSON.parse(localStorage.getItem('listaTallas')) || ["CH","M","G","24","25","26"];
function guardarListas() {
  localStorage.setItem('listaProductos', JSON.stringify(listaProductos));
  localStorage.setItem('listaTallas', JSON.stringify(listaTallas));
}

// ----- Toggle secciones -----
function toggleInventario() {
  const sec = document.getElementById('inventarioSection');
  sec.style.display = (sec.style.display === 'block') ? 'none' : 'block';
  if (sec.style.display === 'block') mostrarInventario();
}
function toggleMovimientos() {
  const sec = document.getElementById('movimientosSection');
  sec.style.display = (sec.style.display === 'block') ? 'none' : 'block';
  if (sec.style.display === 'block') mostrarMovimientos();
}

// ----- Modal genérico -----
function abrirModal(tipo, opts = {}) {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  contenido.innerHTML = '';
  modal.style.display = 'flex';

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
  } else if (tipo === 'talla') {
    const h = document.createElement('h3'); h.innerText = 'Selecciona una talla'; contenido.appendChild(h);
    listaTallas.forEach(t => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerText = t;
      div.onclick = async () => {
        document.getElementById('talla').value = t;
        await autocompletarPreciosPorProductoTalla();
        cerrarModal();
        abrirModalNumero('cantidad', {allowDecimal:false});
      };
      contenido.appendChild(div);
    });
    contenido.appendChild(document.createElement('hr'));
    const btnEdit2 = document.createElement('button');
    btnEdit2.innerText = 'Editar tallas';
    btnEdit2.onclick = () => { cerrarModal(); abrirModalEditar('talla'); };
    contenido.appendChild(btnEdit2);
  }
}

function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
}
window.onclick = (ev) => {
  const modal = document.getElementById('modal');
  if (ev.target === modal) cerrarModal();
};

// ----- Modal numérico -----
function abrirModalNumero(campoId, opts = { allowDecimal: false }) {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  modal.style.display = 'flex';

  const current = ''; // Siempre inicia vacío

  contenido.innerHTML = `
    <div style="text-align:right;"><button id="btnCloseNum">❌ Cerrar</button></div>
    <h3>Ingresa valor</h3>
    <input id="valorTemp" type="text" readonly style="font-size:18px;padding:8px;width:90%;margin:8px 0;border-radius:6px;border:1px solid #ddd;" value="${current}" />
    <div class="keypad" id="keypadArea"></div>
    <div style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
      <button id="btnClear">Limpiar</button>
      <button id="btnConfirm">✔️ Aceptar</button>
      <button id="btnCancel">✖️ Cancelar</button>
    </div>
  `;

  document.getElementById('btnCloseNum').onclick = cerrarModal;

  const keypad = document.getElementById('keypadArea');
  for (let i = 1; i <= 9; i++) {
    const b = document.createElement('button');
    b.innerText = i;
    b.onclick = () => appendDigit(i.toString());
    keypad.appendChild(b);
  }

  const b0 = document.createElement('button');
  b0.innerText = '0';
  b0.onclick = () => appendDigit('0');
  keypad.appendChild(b0);

  if (opts.allowDecimal) {
    const dp = document.createElement('button');
    dp.innerText = '.';
    dp.onclick = () => appendDecimal();
    keypad.appendChild(dp);
  }

  document.getElementById('btnClear').onclick = () => {
    document.getElementById('valorTemp').value = ''; // Borra todo
  };

  document.getElementById('btnCancel').onclick = cerrarModal;

  document.getElementById('btnConfirm').onclick = () => {
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
    if (el.value === '0' && d !== '.') {
      el.value = d;
    } else {
      el.value += d;
    }
  }

  function appendDecimal() {
    const el = document.getElementById('valorTemp');
    if (!el.value.includes('.')) {
      el.value = el.value === '' ? '0.' : el.value + '.';
    }
  }
}

// ----- Editar listas -----
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
    const span = document.createElement('span');
    span.innerText = item;

    const actions = document.createElement('div');
    const btnDel = document.createElement('button');
    btnDel.innerText = '❌';
    btnDel.className = 'small';
    btnDel.onclick = () => {
      if (confirm(`¿Eliminar "${item}"?`)) {
        lista.splice(idx, 1);
        guardarListas();
        // cerramos y reabrimos el modal
        cerrarModal();
        setTimeout(() => abrirModalEditar(tipo), 100);
      }
    };

    actions.appendChild(btnDel);
    div.appendChild(span);
    div.appendChild(actions);
    contenido.appendChild(div);
  });

  contenido.appendChild(document.createElement('hr'));

  const inputNuevo = document.createElement('input');
  inputNuevo.placeholder = tipo === 'producto' ? 'Nuevo producto' : 'Nueva talla';
  inputNuevo.style.width = '70%';
  inputNuevo.style.padding = '8px';
  contenido.appendChild(inputNuevo);

  const btnAdd = document.createElement('button');
  btnAdd.innerText = 'Agregar';
  btnAdd.style.marginLeft = '8px';
  btnAdd.onclick = () => {
    const val = inputNuevo.value.trim();
    if (!val) return alert('Ingresa un valor');
    if (lista.includes(val)) return alert('Ya existe');
    lista.push(val);
    guardarListas();

    // 👇 cerramos y reabrimos para que el DOM se limpie
    cerrarModal();
    setTimeout(() => abrirModalEditar(tipo), 100);
  };
  contenido.appendChild(btnAdd);

  contenido.appendChild(document.createElement('hr'));
  const btnCerrar = document.createElement('button');
  btnCerrar.innerText = 'Cerrar';
  btnCerrar.onclick = cerrarModal;
  contenido.appendChild(btnCerrar);
}


db.collection('config').doc('listas').onSnapshot(doc => {
  const data = doc.data();
  listaProductos = data.productos || [];
  listaTallas = data.tallas || [];
  localStorage.setItem('listaProductos', JSON.stringify(listaProductos));
  localStorage.setItem('listaTallas', JSON.stringify(listaTallas));
});


async function guardarListas() {
  try {
    await db.collection('config').doc('listas').set({
      productos: listaProductos,
      tallas: listaTallas
    });
    localStorage.setItem('listaProductos', JSON.stringify(listaProductos));
    localStorage.setItem('listaTallas', JSON.stringify(listaTallas));
  } catch (e) {
    console.error('Error al guardar listas en Firestore', e);
  }
}

// ----- Autocompletar precios -----
async function autocompletarPreciosPorProductoTalla() {
  const producto=document.getElementById('producto').value.trim();
  const talla=document.getElementById('talla').value.trim();
  const precioCompraField=document.getElementById('precioCompra');
  const precioVentaField=document.getElementById('precioVenta');
  if(!producto||!talla){precioCompraField.value=(0).toFixed(2);precioVentaField.value=(0).toFixed(2);return;}
  try{
    const id=`${producto}_${talla}`;
    const ref=db.collection('productos').doc(id);
    const doc=await ref.get();
    if(doc.exists){
      const data=doc.data();
      precioCompraField.value=(parseFloat(data.precioCompra)||0).toFixed(2);
      precioVentaField.value=(parseFloat(data.precioVenta)||0).toFixed(2);
    } else {
      precioCompraField.value=(0).toFixed(2);precioVentaField.value=(0).toFixed(2);
    }
  }catch(err){console.error('Error autocompletar',err);}
}

// ----- Agregar producto -----
async function agregarProducto() {
  const producto=document.getElementById('producto').value.trim();
  const talla=document.getElementById('talla').value.trim();
  const cantidad=parseInt(document.getElementById('cantidad').value||'0');
  const precioCompra=parseFloat(document.getElementById('precioCompra').value||'0')||0;
  const precioVenta=parseFloat(document.getElementById('precioVenta').value||'0')||0;
  if(!producto||!talla||!cantidad||!precioCompra||!precioVenta)return alert('⚠️ Completa todos los campos.');
  const id=`${producto}_${talla}`;
  const ref=db.collection('productos').doc(id);
  const doc=await ref.get();
  if(doc.exists) await ref.update({cantidad:doc.data().cantidad+cantidad,precioCompra,precioVenta});
  else await ref.set({producto,talla,cantidad,precioCompra,precioVenta});
  await db.collection('movimientos').add({tipo:'compra',producto,talla,cantidad,total:cantidad*precioCompra,fecha:new Date()});
  alert(`✅ Agregado ${cantidad} ${producto}(s) talla ${talla}`);
  if(document.getElementById('inventarioSection').style.display==='block')mostrarInventario();
  if(document.getElementById('movimientosSection').style.display==='block')mostrarMovimientos();
}

// ----- Vender producto -----
async function venderProducto() {
  const producto=document.getElementById('producto').value.trim();
  const talla=document.getElementById('talla').value.trim();
  const cantidad=parseInt(document.getElementById('cantidad').value||'0');
  if(!producto||!talla||!cantidad)return alert('⚠️ Completa los campos.');
  const id=`${producto}_${talla}`;
  const ref=db.collection('productos').doc(id);
  const doc=await ref.get();
  if(doc.exists&&doc.data().cantidad>=cantidad){
    await ref.update({cantidad:doc.data().cantidad-cantidad});
    const precioVenta=parseFloat(doc.data().precioVenta)||parseFloat(document.getElementById('precioVenta').value)||0;
    await db.collection('movimientos').add({tipo:'venta',producto,talla,cantidad,total:cantidad*precioVenta,fecha:new Date()});
    alert(`💰 Venta registrada: ${cantidad} ${producto}(s)`);
    mostrarInventario();mostrarMovimientos();
  } else alert('❌ No hay suficiente inventario.');
}

// ----- Mostrar inventario -----
async function mostrarInventario() {
  const tabla=document.querySelector('#tablaInventario tbody');tabla.innerHTML='';let totalInvertido=0;
  const snapshot=await db.collection('productos').get();
  snapshot.forEach(doc=>{
    const p=doc.data();
    const row=tabla.insertRow();
    row.innerHTML=`<td>${p.producto}</td><td>${p.talla}</td><td>${p.cantidad}</td><td>$${(p.precioCompra||0).toFixed(2)}</td><td>$${(p.precioVenta||0).toFixed(2)}</td><td>$${((p.precioCompra||0)*(p.cantidad||0)).toFixed(2)}</td>`;
    totalInvertido+=(p.precioCompra||0)*(p.cantidad||0);
    row.onclick=()=>{tabla.querySelectorAll('tr').forEach(r=>r.style.backgroundColor='');row.style.backgroundColor='#e0e0e0';};
    row.ondblclick=()=>editarFilaInventario(doc.id);
  });
  document.getElementById('totalInvertido').innerText=`Total invertido: $${totalInvertido.toFixed(2)}`;
  calcularResumen();
}

// ----- Mostrar movimientos -----
async function mostrarMovimientos() {
  const tabla=document.querySelector('#tablaMovimientos tbody');tabla.innerHTML='';
  const snapshot=await db.collection('movimientos').orderBy('fecha','desc').get();
  snapshot.forEach(doc=>{
    const m=doc.data();let fechaText='';
    try{fechaText=m.fecha?.toDate?new Date(m.fecha.toDate()).toLocaleString():new Date(m.fecha).toLocaleString();}catch{fechaText=new Date().toLocaleString();}
    const fila=tabla.insertRow();
    fila.innerHTML=`<td>${m.tipo}</td><td>${m.producto}</td><td>${m.talla}</td><td>${m.cantidad}</td><td>${m.total?'$'+(m.total).toFixed(2):'-'}</td><td>${fechaText}</td>`;
  });
  calcularResumen();
}

// ----- Calcular resumen -----
async function calcularResumen() {
  let totalInvertido=0,totalVendido=0;
  const inv=await db.collection('productos').get();
  inv.forEach(doc=>totalInvertido+=(doc.data().precioCompra||0)*(doc.data().cantidad||0));
  const ventas=await db.collection('movimientos').where('tipo','==','venta').get();
  ventas.forEach(doc=>totalVendido+=(doc.data().total||0));
  document.getElementById('totalInvertido').innerText=`Total invertido: $${totalInvertido.toFixed(2)}`;
  document.getElementById('totalVendido').innerText=`Total vendido: $${totalVendido.toFixed(2)}`;
  document.getElementById('utilidad').innerText=`Utilidad: $${(totalVendido-totalInvertido).toFixed(2)}`;
}

// ----- Editar fila inventario -----
async function editarFilaInventario(docId){
  const ref=db.collection('productos').doc(docId);const doc=await ref.get();if(!doc.exists)return alert('Producto no encontrado');
  const d=doc.data();const modal=document.getElementById('modal');const c=document.getElementById('contenidoModal');modal.style.display='flex';
  c.innerHTML=`<div style="text-align:right;"><button id="btnCloseEdit">❌ Cerrar</button></div>
  <h3>Editar producto</h3>
  <label>Producto:</label><input id="editProducto" value="${d.producto}" readonly><br/>
  <label>Talla:</label><input id="editTalla" value="${d.talla}" readonly><br/>
  <label>Cantidad:</label><input type="number" id="editCantidad" value="${d.cantidad}"><br/>
  <label>Precio Compra:</label><input type="number" step="0.01" id="editPrecioCompra" value="${d.precioCompra}"><br/>
  <label>Precio Venta:</label><input type="number" step="0.01" id="editPrecioVenta" value="${d.precioVenta}"><br/><br/>
  <button id="btnSaveEdit">💾 Guardar cambios</button>`;
  document.getElementById('btnCloseEdit').onclick=cerrarModal;
  document.getElementById('btnSaveEdit').onclick=async()=>{
    const cantidad=parseInt(document.getElementById('editCantidad').value)||0;
    const pc=parseFloat(document.getElementById('editPrecioCompra').value)||0;
    const pv=parseFloat(document.getElementById('editPrecioVenta').value)||0;
    await ref.update({cantidad,precioCompra:pc,precioVenta:pv});
    alert('✅ Cambios guardados.');cerrarModal();mostrarInventario();calcularResumen();
  };
}

function abrirModalReporte() {
  const modal = document.getElementById('modal');
  const contenido = document.getElementById('contenidoModal');
  modal.style.display = 'flex';
  contenido.innerHTML = '';

  // botón cerrar
  const btnCerrarTop = document.createElement('div');
  btnCerrarTop.style.textAlign = 'right';
  const btnCerrar = document.createElement('button');
  btnCerrar.innerText = '❌ Cerrar';
  btnCerrar.onclick = cerrarModal;
  btnCerrarTop.appendChild(btnCerrar);
  contenido.appendChild(btnCerrarTop);

  // título
  const h = document.createElement('h3');
  h.innerText = 'Selecciona los productos para el reporte';
  contenido.appendChild(h);

  // generar checkboxes por productos
  listaProductos.forEach(p => {
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.value = p;
    chk.id = `chk_${p}`;
    const label = document.createElement('label');
    label.htmlFor = `chk_${p}`;
    label.innerText = p;
    div.appendChild(chk);
    div.appendChild(label);
    contenido.appendChild(div);
  });

  // botón generar reporte
  const btnGenerar = document.createElement('button');
  btnGenerar.innerText = '📊 Generar reporte';
  btnGenerar.style.marginTop = '10px';
  btnGenerar.onclick = async () => {
    const seleccionados = [];
    listaProductos.forEach(p => {
      const chk = document.getElementById(`chk_${p}`);
      if (chk.checked) seleccionados.push(p);
    });
    if (seleccionados.length === 0) return alert('Selecciona al menos un producto');
    await generarReporteProductos(seleccionados);
  };
  contenido.appendChild(btnGenerar);
}

async function generarReporteProductos(productosSeleccionados) {
  const contenido = document.getElementById('contenidoModal');
  contenido.innerHTML = ''; // limpiar modal

  const h = document.createElement('h3');
  h.innerText = 'Reporte de Inventario por Producto';
  contenido.appendChild(h);

  let totalGeneralCantidad = 0;
  let totalGeneralInvertido = 0;
  let totalGeneralValorVenta = 0;

  try {
    const snapshot = await db.collection('productos').get();

    for (let producto of productosSeleccionados) {
      const items = snapshot.docs
        .map(doc => doc.data())
        .filter(p => p.producto === producto);

      if (items.length === 0) continue;

      const hGrupo = document.createElement('h4');
      hGrupo.innerText = `Producto: ${producto}`;
      hGrupo.style.marginTop = '12px';
      contenido.appendChild(hGrupo);

      const tabla = document.createElement('table');
      tabla.style.width = '100%';
      tabla.style.borderCollapse = 'collapse';
      tabla.innerHTML = `
        <thead>
          <tr>
            <th>Talla</th>
            <th>Cantidad</th>
            <th>Invertido</th>
            <th>Valor Venta</th>
            <th>Utilidad Potencial</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const thead = tabla.querySelector('thead tr');
      thead.style.setProperty('background', '#007bff', 'important');
      thead.querySelectorAll('th').forEach(th => {
        th.style.setProperty('color', 'white', 'important');
      });

      const tbody = tabla.querySelector('tbody');

      let totalCantidad = 0;
      let totalInvertido = 0;
      let totalValorVenta = 0;

      items.forEach(p => {
        const invertido = (p.precioCompra || 0) * (p.cantidad || 0);
        const valorVenta = (p.precioVenta || 0) * (p.cantidad || 0);
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${p.talla}</td>
          <td>${p.cantidad}</td>
          <td>$${invertido.toFixed(2)}</td>
          <td>$${valorVenta.toFixed(2)}</td>
          <td>$${(valorVenta - invertido).toFixed(2)}</td>
        `;
        totalCantidad += p.cantidad || 0;
        totalInvertido += invertido;
        totalValorVenta += valorVenta;
      });

      const rowTotal = tbody.insertRow();
      rowTotal.style.fontWeight = 'bold';
      rowTotal.style.background = '#e0e0e0';
      rowTotal.innerHTML = `
        <td>Total</td>
        <td>${totalCantidad}</td>
        <td>$${totalInvertido.toFixed(2)}</td>
        <td>$${totalValorVenta.toFixed(2)}</td>
        <td>$${(totalValorVenta - totalInvertido).toFixed(2)}</td>
      `;

      contenido.appendChild(tabla);

      const hr = document.createElement('hr');
      hr.style.margin = '12px 0';
      contenido.appendChild(hr);

      totalGeneralCantidad += totalCantidad;
      totalGeneralInvertido += totalInvertido;
      totalGeneralValorVenta += totalValorVenta;
    }

    const hTotalGeneral = document.createElement('h4');
    hTotalGeneral.innerText = 'TOTAL GENERAL';
    hTotalGeneral.style.marginTop = '12px';
    contenido.appendChild(hTotalGeneral);

    const tablaTotal = document.createElement('table');
    tablaTotal.style.width = '100%';
    tablaTotal.style.borderCollapse = 'collapse';
    tablaTotal.innerHTML = `
      <thead>
        <tr>
          <th class="total-general">Cantidad</th>
          <th class="total-general">Invertido</th>
          <th class="total-general">Valor Venta</th>
          <th class="total-general">Utilidad Potencial</th>
        </tr>
      </thead>
      <tbody>
        <tr style="font-weight:bold; background:#d0d0d0;">
          <td>${totalGeneralCantidad}</td>
          <td>$${totalGeneralInvertido.toFixed(2)}</td>
          <td>$${totalGeneralValorVenta.toFixed(2)}</td>
          <td>$${(totalGeneralValorVenta - totalGeneralInvertido).toFixed(2)}</td>
        </tr>
      </tbody>
    `;
    const theadTotal = tablaTotal.querySelector('thead tr');
    theadTotal.style.setProperty('background', '#800080', 'important');
    theadTotal.querySelectorAll('th').forEach(th => {
      th.style.setProperty('color', 'white', 'important');
    });

    contenido.appendChild(tablaTotal);

    const btnCerrar = document.createElement('button');
    btnCerrar.innerText = '❌ Cerrar';
    btnCerrar.style.marginTop = '10px';
    btnCerrar.onclick = cerrarModal;
    contenido.appendChild(btnCerrar);

  } catch (e) {
    console.error('generarReporteProductos err', e);
  }
}

function toggleResumen() {
  const resumen = document.getElementById('resumen');
  if (resumen.style.display === 'none' || resumen.style.display === '') {
    resumen.style.display = 'block';
  } else {
    resumen.style.display = 'none';
  }
}

// ----- Buscar producto por código, nombre o talla -----
async function buscarPorCodigo(codigo) {
  if (!codigo) return;
  
  // 🔧 Normalizar: quitar espacios, pasar a minúsculas y eliminar acentos
  const normalizeText = (str) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")  // quita acentos
      .replace(/\s+/g, "");

  const codigoNorm = normalizeText(codigo);

  try {
    const snapshot = await db.collection('productos').get();
    let encontrado = null;

    // Detectar si el código tiene texto y talla (ej: "calceta24" o "cinturonm")
    const regex = /^([a-zA-Z\s]+)(\d+|ch|m|g|l|xl)?$/i;
    const match = codigoNorm.match(regex);
    const baseProducto = match ? match[1].trim() : codigoNorm;
    const posibleTalla = match && match[2] ? match[2].toUpperCase() : null;

    snapshot.forEach(doc => {
      const p = doc.data();

      // Normalizar producto y talla del registro
      const productoNorm = normalizeText(p.producto || "");
      const tallaNorm = normalizeText(p.talla || "");
      const codigoExacto = (productoNorm + tallaNorm);

      // Comparar sin acentos y sin espacios
      if (codigoExacto === codigoNorm) {
        encontrado = p;
      }
      else if (!posibleTalla && productoNorm.includes(baseProducto)) {
        encontrado = p;
      }
    });

    if (encontrado) {
      document.getElementById('producto').value = encontrado.producto || '';
      document.getElementById('talla').value = encontrado.talla || '';
      document.getElementById('precioCompra').value = (encontrado.precioCompra || 0).toFixed(2);
      document.getElementById('precioVenta').value = (encontrado.precioVenta || 0).toFixed(2);
      console.log('✅ Producto encontrado:', encontrado);
    } else {
      console.log('⚠️ No se encontró coincidencia exacta.');
    }
  } catch (e) {
    console.error('Error al buscar producto:', e);
  }
}


// Function para imprimir codigo de barras

// ----- Función para imprimir etiqueta de código de barras -----

function imprimirEtiqueta() {
  const codigo = document.getElementById("buscarCodigo").value.trim();
  const producto = document.getElementById("producto")?.value.trim() || "";
  const talla = document.getElementById("talla")?.value.trim() || "";

  if (!codigo) {
    alert("Por favor, ingresa o busca primero un código de producto.");
    return;
  }

  const labelName = producto && talla ? `${producto} ${talla}` : codigo;

  // Crear una nueva ventana para imprimir
  const printWindow = window.open("", "_blank", "width=450,height=500");

  // Escribir HTML con estilos mejorados y centrado
  printWindow.document.write(`
    <html>
      <head>
        <title>Etiqueta de Producto</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            margin: 0;
          }
          h3 {
            margin-bottom: 15px;
            font-size: 18px;
          }
          .barcode-container, .qr-container {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 10px auto;
          }
          svg {
            width: 300px;
            height: 100px;
          }
          #qrcode canvas {
            width: 150px !important;
            height: 150px !important;
          }
          h4 {
            margin-top: 15px;
            font-size: 16px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h3>Etiqueta de Producto</h3>

        <div class="barcode-container">
          <svg id="barcode"></svg>
        </div>

        <div class="qr-container">
          <div id="qrcode"></div>
        </div>

        <h4>${labelName}</h4>

        <!-- Cargar librerías dentro de la ventana -->
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs/qrcode.min.js"></script>
        <script>
          // Generar código de barras
          JsBarcode(document.getElementById("barcode"), "${codigo}", {
            format: "CODE128",
            displayValue: true,
            fontSize: 18,
            height: 100,
            lineColor: "#000000",
          });

          // Generar código QR
          new QRCode(document.getElementById("qrcode"), {
            text: "${codigo}",
            width: 150,
            height: 150,
          });

          // Esperar un momento para que se rendericen los gráficos
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, 700);
        <\/script>
      </body>
    </html>
  `);

  printWindow.document.close();
}


// Doble clic en el campo de búsqueda => copiar producto + talla
document.getElementById('buscarCodigo').addEventListener('dblclick', () => {
  const producto = (document.getElementById('producto')?.value || '').trim();
  const talla = (document.getElementById('talla')?.value || '').trim();

  if (!producto && !talla) {
    alert('No hay valores en Producto o Talla para copiar.');
    return;
  }

  // Combinar con espacio si ambos existen
  const codigo = talla ? `${producto} ${talla}` : producto;

  // Asignar al input de búsqueda
  const inputBuscar = document.getElementById('buscarCodigo');
  inputBuscar.value = codigo;

  // Ejecutar la búsqueda automáticamente (opcional)
  if (typeof buscarPorCodigo === 'function') {
    buscarPorCodigo(codigo);
  }
});


let escaneoActivo = false;
let qrReader = null;

document.getElementById("btnScanToggle").addEventListener("click", () => {
  if (!escaneoActivo) {
    iniciarEscaneo();
  } else {
    detenerEscaneo();
  }
});

function iniciarEscaneo() {
  if (!qrReader) {
    qrReader = new Html5Qrcode("qr-reader");
  }

  const config = {
    fps: 15,
    qrbox: { width: 280, height: 280 },
    aspectRatio: 1.777,
    disableFlip: true,
    videoConstraints: {
      facingMode: "environment",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  qrReader.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      document.getElementById("buscarCodigo").value = decodedText;
      buscarPorCodigo(decodedText);
      detenerEscaneo(); // Detener automáticamente después de escanear
    },
    (errorMessage) => {
      // Ignorar errores de escaneo
    }
  ).then(() => {
    escaneoActivo = true;
    document.getElementById("btnScanToggle").innerText = "🛑 Detener escaneo";
  }).catch((err) => {
    console.error("Error al iniciar la cámara:", err);
  });
}

function detenerEscaneo() {
  if (qrReader) {
    qrReader.stop().then(() => {
      escaneoActivo = false;
      document.getElementById("qr-reader").innerHTML = "";
      document.getElementById("btnScanToggle").innerText = "📷 Escanear código";
    }).catch((err) => {
      console.error("Error al detener la cámara:", err);
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('producto').addEventListener('click', () => {
    abrirModal('producto');
  });

  document.getElementById('talla').addEventListener('click', () => {
    abrirModal('talla');
  });

  document.getElementById('cantidad').addEventListener('click', () => {
    abrirModalNumero('cantidad', { allowDecimal: false });
  });

  document.getElementById('precioCompra').addEventListener('click', () => {
    abrirModalNumero('precioCompra', { allowDecimal: true });
  });

  document.getElementById('precioVenta').addEventListener('click', () => {
    abrirModalNumero('precioVenta', { allowDecimal: true });
  });
});

window.addEventListener('resize', () => {
  const altura = window.innerHeight;
  const cuerpo = document.body;

  if (altura < 500) {
    cuerpo.classList.add('tecladoAbierto');
  } else {
    cuerpo.classList.remove('tecladoAbierto');
  }
});

// ----- Inicialización -----
window.addEventListener('load', () => {
  //guardarListas();
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
//window.actualizarDatos = actualizarDatos;
