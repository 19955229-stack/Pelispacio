/* ==========================================================
   PeliSpacio - script.js (Transiciones y Navegación Limpias)
   ========================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // Asegura que la página NUNCA quede opaca al cargar o regresar
  document.body.style.opacity = '1';
  document.body.style.filter = 'none';

  inicializarBuscadorYFiltros();
  inicializarPaginaDetalle();
  inicializarFormulario();
  
  // Módulos Interactivos Avanzados
  inicializarEfectosTilt();
  inicializarNavegacionTeclado();
  inicializarBotonSubirArriba();
  inicializarHeaderScroll();
});

/* ----------------------------------------------------------
   1. Búsqueda + Filtros con Animación Fluid
   ---------------------------------------------------------- */
function inicializarBuscadorYFiltros() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;

  const buscador = document.getElementById('buscador');
  const chips = document.querySelectorAll('.chip');
  const tarjetas = document.querySelectorAll('.movie-card');
  const sinResultados = document.getElementById('sin-resultados');

  let filtroActivo = 'todas';

  function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function aplicarFiltros() {
    const textoBusqueda = buscador ? normalizar(buscador.value.trim()) : '';
    let visibles = 0;

    tarjetas.forEach(function (tarjeta, index) {
      const titulo = tarjeta.getAttribute('data-title') || '';
      const categorias = (tarjeta.getAttribute('data-category') || '').split(' ');

      const coincideCategoria = filtroActivo === 'todas' || categorias.includes(filtroActivo);
      const coincideBusqueda = textoBusqueda === '' || normalizar(titulo).includes(textoBusqueda);

      const mostrar = coincideCategoria && coincideBusqueda;
      
      if (mostrar) {
        tarjeta.style.display = 'flex';
        tarjeta.style.animation = `scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${index * 0.03}s forwards`;
        visibles++;
      } else {
        tarjeta.style.display = 'none';
      }
    });

    if (sinResultados) {
      sinResultados.style.display = visibles === 0 ? 'block' : 'none';
      if (visibles === 0) sinResultados.style.animation = 'fadeInUp 0.3s forwards';
    }
  }

  if (buscador) {
    buscador.addEventListener('input', aplicarFiltros);
    buscador.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        buscador.value = '';
        aplicarFiltros();
        mostrarToast('Búsqueda limpiada');
      }
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      const filtro = chip.getAttribute('data-filter');
      if (!filtro) return;

      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filtroActivo = filtro;
      aplicarFiltros();
    });
  });
}

/* ----------------------------------------------------------
   2. Redirección Limpia (SIN EFECTO OPACO)
   ---------------------------------------------------------- */
function irADetallePelicula(boton) {
  const tarjeta = boton.closest('.movie-card');
  if (!tarjeta) return;

  boton.style.transform = 'scale(0.95)';

  const titulo = tarjeta.querySelector('h3') ? tarjeta.querySelector('h3').textContent : '';
  const posterSrc = tarjeta.querySelector('img') ? tarjeta.querySelector('img').getAttribute('src') : '';
  const calidad = tarjeta.querySelector('.badge') ? tarjeta.querySelector('.badge').textContent : 'HD';

  const parametros = new URLSearchParams({
    titulo: titulo,
    poster: posterSrc,
    calidad: calidad,
    subtitulo: tarjeta.getAttribute('data-subtitulo') || '',
    anio: tarjeta.getAttribute('data-anio') || '',
    duracion: tarjeta.getAttribute('data-duracion') || '',
    imdb: tarjeta.getAttribute('data-imdb') || '',
    descripcion: tarjeta.getAttribute('data-descripcion') || '',
    generos: tarjeta.getAttribute('data-generos') || '',
    vimeo: tarjeta.getAttribute('data-vimeo') || '',
    mega: tarjeta.getAttribute('data-mega') || ''
  });

  setTimeout(() => {
    window.location.href = 'pelicula.html?' + parametros.toString();
  }, 100);
}

/* ----------------------------------------------------------
   3. Reproductor Dinámico
   ---------------------------------------------------------- */
function inicializarPaginaDetalle() {
  const contenedor = document.getElementById('detalle-fondo');
  if (!contenedor) return;

  const parametros = new URLSearchParams(window.location.search);
  const titulo = parametros.get('titulo') || 'Película';
  const poster = parametros.get('poster') || '';

  trailersDisponibles.servidor1 = parametros.get('vimeo') || '';
  trailersDisponibles.servidor2 = parametros.get('mega') || '';

  document.title = titulo + ' • PeliSpacio';

  const setTexto = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTexto('detalle-titulo', titulo);
  setTexto('detalle-subtitulo', parametros.get('subtitulo') || '');
  setTexto('detalle-badge-calidad', parametros.get('calidad') || 'HD');
  setTexto('detalle-badge-anio', parametros.get('anio') || '');
  setTexto('detalle-badge-duracion', parametros.get('duracion') || '');
  setTexto('detalle-badge-imdb', parametros.get('imdb') || '');
  setTexto('detalle-descripcion', parametros.get('descripcion') || '');

  const elemPoster = document.getElementById('detalle-poster');
  if (elemPoster) elemPoster.setAttribute('src', poster);
  if (contenedor) contenedor.style.backgroundImage = 'url("' + poster + '")';

  const contenedorGeneros = document.getElementById('detalle-generos');
  if (contenedorGeneros) {
    contenedorGeneros.innerHTML = '';
    (parametros.get('generos') || '').split(',').forEach(genero => {
      if (!genero.trim()) return;
      const span = document.createElement('span');
      span.textContent = genero.trim();
      contenedorGeneros.appendChild(span);
    });
  }

  cambiarServidor(1);
}

const trailersDisponibles = { servidor1: '', servidor2: '' };

function cambiarServidor(numero) {
  const videoResponsive = document.getElementById('video-responsive');
  const tabs = document.querySelectorAll('.servidor-tab');
  if (!videoResponsive) return;

  tabs.forEach(tab => {
    tab.classList.toggle('activo', Number(tab.getAttribute('data-servidor')) === numero);
  });

  videoResponsive.innerHTML = `<div class="loader-video">Cargando servidor ${numero}...</div>`;

  setTimeout(() => {
    if (numero === 2) {
      const megaSrc = trailersDisponibles.servidor2;
      videoResponsive.innerHTML = megaSrc
        ? `<iframe src="${megaSrc}" title="Video Mega" allowfullscreen></iframe>`
        : '<p class="error-msg">Servidor Mega no disponible.</p>';
    } else {
      const vimeoId = trailersDisponibles.servidor1;
      videoResponsive.innerHTML = vimeoId
        ? `<iframe src="https://player.vimeo.com/video/${vimeoId}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
        : '<p class="error-msg">Servidor Vimeo no disponible.</p>';
    }
  }, 300);
}

/* ----------------------------------------------------------
   4. Formulario Interactivo
   ---------------------------------------------------------- */
function inicializarFormulario() {
  const formulario = document.getElementById('contact-form');
  if (!formulario) return;

  const parametros = new URLSearchParams(window.location.search);
  const plan = parametros.get('plan');
  const selectPlan = document.getElementById('subject');
  if (plan && selectPlan) selectPlan.value = plan;

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    const nombre = document.getElementById('name').value.trim();
    const correo = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('message').value.trim();

    if (!nombre || !correo || !mensaje) {
      mostrarToast('Por favor completa todos los campos', 'error');
      return;
    }

    const btnSubmit = formulario.querySelector('button[type="submit"]');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Enviando...';
    }

    setTimeout(() => {
      mostrarToast(`¡Gracias ${nombre}! Mensaje enviado correctamente.`, 'exito');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Mensaje';
      }
      formulario.reset();
    }, 1000);
  });
}

/* ----------------------------------------------------------
   5. Efectos y Notificaciones Toast
   ---------------------------------------------------------- */
function mostrarToast(mensaje, tipo = 'info') {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    document.body.appendChild(toast);
  }

  const item = document.createElement('div');
  item.className = `toast-item ${tipo}`;
  item.textContent = mensaje;
  toast.appendChild(item);

  setTimeout(() => {
    item.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => item.remove(), 300);
  }, 3000);
}

function inicializarEfectosTilt() {
  const tarjetas = document.querySelectorAll('.movie-card, .plan-card');
  tarjetas.forEach(tarjeta => {
    tarjeta.addEventListener('mousemove', (e) => {
      const rect = tarjeta.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      tarjeta.style.transform = `perspective(1000px) rotateX(${-y / 15}deg) rotateY(${x / 15}deg) translateY(-5px)`;
    });

    tarjeta.addEventListener('mouseleave', () => {
      tarjeta.style.transform = '';
    });
  });
}

function inicializarNavegacionTeclado() {
  document.addEventListener('keydown', (e) => {
    const buscador = document.getElementById('buscador');
    if (e.key === '/' && document.activeElement !== buscador) {
      if (buscador) {
        e.preventDefault();
        buscador.focus();
      }
    }
  });
}

function inicializarBotonSubirArriba() {
  const btn = document.createElement('button');
  btn.id = 'btn-top';
  btn.innerHTML = '↑';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });

  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
}

function inicializarHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* Inyección de CSS para Animaciones y Componentes UI */
const cssDinamico = document.createElement('style');
cssDinamico.textContent = `
  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeOut {
    to { opacity: 0; transform: translateY(-10px); }
  }

  #toast-container {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .toast-item {
    background: #111827;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    border-left: 4px solid #0099ff;
    animation: scaleUp 0.3s ease;
  }
  .toast-item.exito { border-left-color: #22c55e; }
  .toast-item.error { border-left-color: #ef4444; }

  #btn-top {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #0099ff;
    color: #fff;
    border: none;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s, transform 0.2s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  #btn-top.visible { opacity: 1; pointer-events: auto; }
  #btn-top:hover { transform: scale(1.1); }

  .loader-video {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #fff;
    font-weight: bold;
  }
`;
document.head.appendChild(cssDinamico);