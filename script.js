let pescadores = [];
let etapas = [];
let capturas = {};

const decimalesPuntos = { 1: 0.0015, 2: 0.0010, 3: 0.0006, 4: 0.0003, 5: 0.0001 };

const tabs = document.querySelectorAll('.tab-btn');
const contenidos = document.querySelectorAll('.tab-content');

const inombrePescador = document.getElementById('nombrePescador');
const btnAgregarPescador = document.getElementById('btnAgregarPescador');
const listaPescadores = document.getElementById('listaPescadores');

const inombreEtapa = document.getElementById('nombreEtapa');
const ihorasEtapa = document.getElementById('horasEtapa');
const btnCrearEtapa = document.getElementById('btnCrearEtapa');
const listaEtapas = document.getElementById('listaEtapas');

const etapaSel = document.getElementById('etapaSel');
const pescadorSel = document.getElementById('pescadorSel');
const horasContainer = document.getElementById('horasContainer');
const btnGuardarCapturas = document.getElementById('btnGuardarCapturas');

const etapaClasifSel = document.getElementById('etapaClasifSel');
const tablaClasifEtapa = document.getElementById('tablaClasifEtapa');
const tablaGeneral = document.getElementById('tablaGeneral');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('activa'));
        contenidos.forEach(c => c.classList.add('hidden'));
        tab.classList.add('activa');
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
    });
});

cargarDeLocal();
actualizarSelectores();

btnAgregarPescador.addEventListener('click', () => {
    const nom = inombrePescador.value.trim();
    if(nom) {
        pescadores.push(nom);
        actualizarListaPescadores();
        actualizarSelectores();
        guardarEnLocal();
        inombrePescador.value = '';
    }
});

function actualizarListaPescadores() {
    listaPescadores.innerHTML = '';
    pescadores.forEach(n => {
        const li = document.createElement('li');
        li.className = "item-lista";
        li.textContent = n;
        listaPescadores.appendChild(li);
    });
}

btnCrearEtapa.addEventListener('click', () => {
    const nom = inombreEtapa.value.trim();
    const hrs = parseInt(ihorasEtapa.value);
    if(nom) {
        const id = Date.now().toString();
        etapas.push({id, nombre: nom, horas: hrs});
        capturas[id] = [];
        actualizarListaEtapas();
        actualizarSelectores();
        guardarEnLocal();
        inombreEtapa.value = '';
    }
});

function actualizarListaEtapas() {
    listaEtapas.innerHTML = '';
    etapas.forEach(e => {
        const div = document.createElement('div');
        div.style.background='white';
        div.style.padding='10px 14px';
        div.style.borderRadius='8px';
        div.style.marginBottom='8px';
        div.style.display='flex';
        div.style.justifyContent='space-between';
        div.style.alignItems='center';
        div.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';
        div.innerHTML = `<span style="font-weight:500">${e.nombre}</span> <span style="font-size:12px; color:#64748b">⏱️ ${e.horas} horas</span>`;
        listaEtapas.appendChild(div);
    });
}

etapaSel.addEventListener('change', () => {
    const etapa = etapas.find(e => e.id === etapaSel.value);
    horasContainer.innerHTML = '';
    if(!etapa) return;

    for(let i=1; i<=etapa.horas; i++) {
        const div = document.createElement('div');
        div.className = "hora-item";
        div.innerHTML = `
            <label>Hora ${i}</label>
            <input type="number" min="0" value="0" class="input-bonito text-center" style="width:100%" data-hora="${i}">
        `;
        horasContainer.appendChild(div);
    }
});

btnGuardarCapturas.addEventListener('click', () => {
    const idEtapa = etapaSel.value;
    const pesc = pescadorSel.value;
    if(!idEtapa || !pesc) return alert('⚠️ Complete los datos');

    const etapa = etapas.find(e => e.id === idEtapa);
    const horas = {};
    document.querySelectorAll('.input-bonito[data-hora]').forEach(inp => {
        horas[`h${inp.dataset.hora}`] = parseInt(inp.value) || 0;
    });

    const total = Object.values(horas).reduce((a,b) => a+b, 0);
    const registro = { pescador: pesc, ...horas, total };

    const idx = capturas[idEtapa].findIndex(r => r.pescador === pesc);
    idx >=0 ? capturas[idEtapa][idx] = registro : capturas[idEtapa].push(registro);

    guardarEnLocal();
    etapaSel.value = ''; pescadorSel.value = ''; horasContainer.innerHTML = '';
    alert('✅ Guardado correctamente');
});

etapaClasifSel.addEventListener('change', () => {
    const idEtapa = etapaClasifSel.value;
    if(!idEtapa) return tablaClasifEtapa.innerHTML = '<tr><td colspan="7" class="text-center" style="color:#94a3b8;">Seleccione una etapa</td></tr>';

    const etapa = etapas.find(e => e.id === idEtapa);
    let datos = [...capturas[idEtapa]];

    datos.sort((a,b) => {
        if(b.total !== a.total) return b.total - a.total;
        const ultH = etapa.horas === 3 ? 'h3' : 'h2';
        if(b[ultH] !== a[ultH]) return b[ultH] - a[ultH];
        if(b.h2 !== a.h2) return b.h2 - a.h2;
        return b.h1 - a.h1;
    });

    let resultadoFinal = [];
    let puestoActual = 1;
    const totalParticipantes = datos.length;

    for(let i=0; i<datos.length; i++) {
        if(i > 0) {
            const ant = datos[i-1];
            const act = datos[i];
            const ultH = etapa.horas === 3 ? 'h3' : 'h2';
            
            if(act.total === ant.total && act[ultH] === ant[ultH] && act.h2 === ant.h2 && act.h1 === ant.h1) {
                puestoActual = resultadoFinal[i-1].puesto;
            } else {
                puestoActual = i + 1;
            }
        }
        const puntos = totalParticipantes + (decimalesPuntos[puestoActual] || 0);
        resultadoFinal.push({...datos[i], puesto: puestoActual, puntos});
    }

    tablaClasifEtapa.innerHTML = '';
    resultadoFinal.forEach(res => {
        const fila = document.createElement('tr');
        if(res.puesto === 1) fila.className = "puesto-1";
        if(res.puesto === 2) fila.className = "puesto-2";
        if(res.puesto === 3) fila.className = "puesto-3";

        fila.innerHTML = `
            <td class="text-center" style="font-size:18px; font-weight:bold;">${res.puesto}</td>
            <td style="font-weight:500;">${res.pescador}</td>
            <td class="text-center">${res.h1}</td>
            <td class="text-center">${res.h2 || '-'}</td>
            <td class="text-center">${res.h3 || '-'}</td>
            <td class="text-center text-primary">${res.total}</td>
            <td class="text-center" style="font-family:monospace; color:#0E7490; font-weight:600;">${res.puntos.toFixed(4)}</td>
        `;
        tablaClasifEtapa.appendChild(fila);
    });

    actualizarClasificacionGeneral();
});

function actualizarClasificacionGeneral() {
    let acumulado = {};
    pescadores.forEach(p => acumulado[p] = { total: 0, detalle: [] });

    etapas.forEach(et => {
        let datosEtapa = [...capturas[et.id]];
        datosEtapa.sort((a,b) => {
            if(b.total !== a.total) return b.total - a.total;
            const ultH = et.horas === 3 ? 'h3' : 'h2';
            if(b[ultH] !== a[ultH]) return b[ultH] - a[ultH];
            if(b.h2 !== a.h2) return b.h2 - a.h2;
            return b.h1 - a.h1;
        });

        let puestoActual = 1;
        for(let i=0; i<datosEtapa.length; i++) {
            if(i>0) {
                const ant = datosEtapa[i-1];
                const act = datosEtapa[i];
                const ultH = et.horas === 3 ? 'h3' : 'h2';
                if(!(act.total === ant.total && act[ultH] === ant[ultH] && act.h2 === ant.h2 && act.h1 === ant.h1)) {
                    puestoActual = i+1;
                }
            }
            const pts = datosEtapa.length + (decimalesPuntos[puestoActual] || 0);
            if(acumulado[datosEtapa[i].pescador]) {
                acumulado[datosEtapa[i].pescador].total += pts;
                acumulado[datosEtapa[i].pescador].detalle.push(`${et.nombre}:${pts.toFixed(4)}`);
            }
        }
    });

    const ranking = Object.entries(acumulado)
        .map(([nombre, datos]) => ({nombre, ...datos}))
        .sort((a,b) => a.total - b.total);

    tablaGeneral.innerHTML = '';
    ranking.forEach((pos, idx) => {
        const fila = document.createElement('tr');
        if(idx === 0) fila.className = "puesto-1";
        fila.innerHTML = `
            <td class="text-center" style="font-size:18px; font-weight:bold;">${idx+1}</td>
            <td style="font-weight:500;">${pos.nombre}</td>
            <td class="text-center text-accent">${pos.total.toFixed(4)}</td>
            <td style="font-size:12px; color:#475569;">${pos.detalle.join(' | ') || '-'}</td>
        `;
        tablaGeneral.appendChild(fila);
    });
}

function actualizarSelectores() {
    [etapaSel, etapaClasifSel].forEach(s => {
        s.innerHTML = '<option value="">-- Seleccionar --</option>';
        etapas.forEach(e => { const o = new Option(e.nombre, e.id); s.add(o); });
    });
    pescadorSel.innerHTML = '<option value="">-- Seleccionar --</option>';
    pescadores.forEach(p => { const o = new Option(p, p); pescadorSel.add(o); });
}

function guardarEnLocal() {
    localStorage.setItem('torneoPescaData', JSON.stringify({pescadores, etapas, capturas}));
}

function cargarDeLocal() {
    const d = localStorage.getItem('torneoPescaData');
    if(d) {
        const obj = JSON.parse(d);
        pescadores = obj.pescadores || [];
        etapas = obj.etapas || [];
        capturas = obj.capturas || {};
        actualizarListaPescadores();
        actualizarListaEtapas();
    }
}