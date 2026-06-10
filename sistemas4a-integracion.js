/**
 * Sistemas 4A - Integración con Equipo Técnico IA
 * Conecta el modal de IA existente con el webhook de n8n
 */

const SISTEMAS4A = {
  // Configuración
  config: {
    n8nUrl: 'http://localhost:5678/webhook/sistemas4a-equipo-tecnico',
    webhookConfirmar: 'http://localhost:5678/webhook/sistemas4a-confirmar-citas',
    geminiApiKey: 'TU_API_KEY_AQUI' // Solo si necesitas fallback local
  },

  // Estado de la sesión
  session: {
    id: null,
    nombre: '',
    telefono: '',
    servicio: '',
    fase: 'inicio', // inicio | diagnostico | agendamiento | confirmado
    historial: [],
    intentos: 0
  },

  // Inicializar sesión
  iniciarSesion(datos) {
    this.session.id = '4A-' + Date.now().toString(36).toUpperCase();
    this.session.nombre = datos.nombre || '';
    this.session.telefono = datos.telefono || '';
    this.session.servicio = datos.servicio || 'soporte';
    this.session.historial = [];
    this.session.fase = 'diagnostico';
    this.session.intentos = 0;
    
    console.log('📱 Sesión iniciada:', this.session.id);
  },

  // Enviar al Equipo Técnico IA
  async enviarAlEquipoTecnico(mensaje, imagenBase64 = null) {
    const carga = {
      session_id: this.session.id,
      nombre: this.session.nombre,
      telefono: this.session.telefono,
      problema: mensaje,
      servicio: this.session.servicio,
      historial: this.session.historial,
      timestamp: new Date().toISOString()
    };

    if (imagenBase64) {
      carga.imagen = imagenBase64;
      carga.tipo_imagen = 'image/jpeg';
    }

    // Actualizar historial
    this.session.historial.push({
      rol: 'cliente',
      mensaje: mensaje,
      imagen: !!imagenBase64,
      timestamp: new Date().toISOString()
    });

    console.log('🧪 Enviando al Equipo Técnico...', carga);

    try {
      const respuesta = await fetch(this.config.n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carga)
      });

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const resultado = await respuesta.json();
      console.log('✅ Respuesta del Equipo Técnico:', resultado);

      this.session.historial.push({
        rol: 'sistema',
        mensaje: resultado.mensaje || 'Análisis completado',
        timestamp: new Date().toISOString()
      });

      // Verificar si está listo para agendar
      if (resultado.listo_para_agendar || resultado.diagnostico_final) {
        this.session.fase = 'agendamiento';
        this.mostrarOpcionesHorario(resultado.opciones_horario);
      }

      return resultado;

    } catch (error) {
      console.error('❌ Error:', error);
      // Fallback: responder localmente
      return this.fallbackLocal(mensaje, imagenBase64);
    }
  },

  // Fallback si n8n no está disponible
  fallbackLocal(mensaje, imagen) {
    const servicioInfo = {
      soporte: 'Analizando problema de soporte técnico...',
      infra: 'Evaluando infraestructura crítica...',
      cyber: 'Ejecutando análisis de seguridad...',
      ia: 'Procesando solicitud de automatización...'
    };

    const respuesta = {
      fase: 'diagnostico',
      mensaje: servicioInfo[this.session.servicio] || 'Procesando su solicitud...',
      preguntas: [
        '¿Cuándo comenzó el problema?',
        '¿Ha notado algún mensaje de error específico?',
        '¿Hay algún indicador visual (luces, sonidos)?'
      ],
      listo_para_agendar: false
    };

    this.session.historial.push({
      rol: 'sistema',
      mensaje: respuesta.mensaje,
      timestamp: new Date().toISOString()
    });

    return respuesta;
  },

  // Mostrar opciones de horario al cliente
  mostrarOpcionesHorario(opciones) {
    if (!opciones || opciones.length === 0) return;

    const mensaje = `🎯 *Diagnóstico Completado*\n\n`;
    const opcionesTexto = opciones.map((opt, i) => {
      const fecha = new Date(opt);
      const fechaStr = fecha.toLocaleDateString('es-VE', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      return `${i + 1}) ${fechaStr}`;
    }).join('\n');

    const mensajeCompleto = `${mensaje}Selecciona tu horario:\n\n${opcionesTexto}\n\nResponde con 1, 2 o 3`;

    // Enviar por WhatsApp
    this.enviarWhatsApp(mensajeCompleto);
  },

  // Enviar mensaje por WhatsApp
  async enviarWhatsApp(mensaje, telefono = null) {
    const tel = telefono || this.session.telefono;
    const telLimpio = tel.replace(/\D/g, '');
    const url = `https://wa.me/58${telLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    window.open(url, '_blank');
  },

  // Confirmar cita seleccionada
  async confirmarCita(opcion, opciones) {
    if (opcion < 1 || opcion > opciones.length) {
      return { success: false, mensaje: 'Opción inválida' };
    }

    const fechaSeleccionada = opciones[opcion - 1];

    try {
      const respuesta = await fetch(this.config.webhookConfirmar, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caso_id: this.session.id,
          nombre: this.session.nombre,
          telefono: this.session.telefono,
          fecha_seleccionada: fechaSeleccionada,
          servicio: this.session.servicio,
          confirmar: true
        })
      });

      this.session.fase = 'confirmado';

      return { 
        success: true, 
        fecha: fechaSeleccionada,
        mensaje: `✅ *Cita Confirmada*\n\n📅 ${new Date(fechaSeleccionada).toLocaleString('es-VE')}`
      };

    } catch (error) {
      return { 
        success: false, 
        mensaje: 'Hubo un error. Por favor contacta directamente por WhatsApp.' 
      };
    }
  },

  // Función principal para integrar con tu modal IA existente
  async procesarConIA(mensaje, datosCliente, imagenBase64 = null) {
    // Iniciar sesión si no existe
    if (!this.session.id) {
      this.iniciarSesion(datosCliente);
    }

    // Enviar al equipo técnico
    const resultado = await this.enviarAlEquipoTecnico(mensaje, imagenBase64);

    // Procesar respuesta según fase
    switch (resultado.fase) {
      case 'diagnostico':
        return {
          tipo: 'preguntas',
          mensaje: resultado.mensaje,
          preguntas: resultado.preguntas || []
        };

      case 'agendamiento':
        return {
          tipo: 'agendamiento',
          mensaje: resultado.mensaje,
          diagnostico: resultado.diagnostico_final,
          opciones: resultado.opciones_horario
        };

      case 'confirmado':
        return {
          tipo: 'confirmado',
          mensaje: resultado.mensaje,
          fecha: resultado.fecha
        };

      default:
        return { tipo: 'error', mensaje: 'Procesando...' };
    }
  }
};

// ============================================
// INTEGRACIÓN CON TU HTML EXISTENTE
// ============================================

/**
 * Reemplaza tu función analyzeIA() existente
 * con esta versión que usa el Equipo Técnico
 */

async function analyzeIATeam() {
  const promptInput = document.getElementById('ia-prompt').value.trim();
  const contact = document.getElementById('ia-contact-info').value.trim();
  const btn = document.getElementById('ia-btn');
  const resultBox = document.getElementById('ia-result');

  if (!promptInput || !contact) {
    alert("⚠️ Por favor describa el problema y deje su contacto.");
    return;
  }

  // Extraer nombre y teléfono
  const partes = contact.split(/[\s,\-]+/);
  const nombre = partes[0] || 'Cliente';
  const telefono = partes.slice(1).join('') || '';

  // Verificar si hay imagen
  let imagenBase64 = null;
  const preview = document.getElementById('preview-src');
  if (preview && preview.src && preview.src !== window.location.href) {
    imagenBase64 = preview.src.split(',')[1];
  }

  // UI: Loading
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-users-gear fa-spin"></i> ANALIZANDO EQUIPO TÉCNICO...';
  resultBox.innerHTML = `
    <div class="text-center p-8">
      <div class="text-4xl mb-4">🧪</div>
      <p class="text-white font-bold">Nuestro equipo de 5 especialistas está analizando tu caso...</p>
      <div class="flex justify-center gap-2 mt-4">
        <span class="text-s4a-blue text-xs">🔍 Triaje</span>
        <span class="text-slate-400">→</span>
        <span class="text-s4a-accent text-xs">⚙️ HW</span>
        <span class="text-slate-400">→</span>
        <span class="text-purple-400 text-xs">💻 SW</span>
        <span class="text-slate-400">→</span>
        <span class="text-yellow-400 text-xs">🌐 Redes</span>
        <span class="text-slate-400">→</span>
        <span class="text-red-400 text-xs">🔐 Seguridad</span>
      </div>
    </div>
  `;

  try {
    // Enviar al Equipo Técnico
    const resultado = await SISTEMAS4A.procesarConIA(
      promptInput,
      { nombre, telefono, servicio: activeContext },
      imagenBase64
    );

    // Mostrar resultado según tipo
    if (resultado.tipo === 'preguntas') {
      resultBox.innerHTML = `
        <div class="space-y-4 animate-fadeIn">
          <div class="border-l-4 border-yellow-400 pl-4">
            <h5 class="text-yellow-400 text-[9px] font-black uppercase tracking-widest mb-1">🧠 Análisis en Progreso</h5>
            <p class="text-slate-200 text-sm">${resultado.mensaje}</p>
          </div>
          <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
            <h5 class="text-s4a-blue text-[9px] font-black uppercase tracking-widest mb-2">📝 Necesito saber más:</h5>
            ${resultado.preguntas.map(p => `<p class="text-slate-300 text-xs mb-2">• ${p}</p>`).join('')}
          </div>
        </div>
      `;
      goToStep(2); // Volver a preguntas
    } else if (resultado.tipo === 'agendamiento') {
      // Mostrar diagnóstico + opciones de horario
      resultBox.innerHTML = `
        <div class="space-y-4 animate-fadeIn">
          <div class="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/30">
            <h5 class="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-2">✅ Diagnóstico del Equipo</h5>
            <p class="text-white text-sm mb-2"><strong>Problema:</strong> ${resultado.diagnostico?.principal || 'Identificado'}</p>
            <p class="text-slate-300 text-xs"><strong>Causa:</strong> ${resultado.diagnostico?.causa || 'Por determinar'}</p>
            <p class="text-slate-300 text-xs mt-2"><strong>Solución:</strong> ${resultado.diagnostico?.solucion || 'Se definirá en la cita'}</p>
          </div>
          <div class="bg-slate-900/40 p-4 rounded-2xl border border-white/10">
            <h5 class="text-s4a-blue text-[9px] font-black uppercase tracking-widest mb-2">📅 Selecciona tu horario:</h5>
            ${resultado.opciones.map((opt, i) => `
              <button onclick="seleccionarHorario(${i + 1}, ${JSON.stringify(resultado.opciones).replace(/"/g, '&quot;')})" 
                class="w-full text-left p-3 mb-2 bg-white/5 hover:bg-s4a-blue/20 rounded-xl border border-white/10 transition-all">
                <span class="text-white text-sm">${i + 1}) ${new Date(opt).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      goToStep(3);
    }

  } catch (error) {
    console.error('Error:', error);
    resultBox.innerHTML = `
      <div class="bg-red-500/10 p-4 rounded-2xl border border-red-500/30">
        <p class="text-red-400 text-sm">Hubo un error. Por favor contacta directamente por WhatsApp.</p>
      </div>
    `;
  }

  btn.disabled = false;
  btn.innerHTML = 'GENERAR REPORTE IA <i class="fas fa-bolt-lightning"></i>';
}

// Función para seleccionar horario
window.seleccionarHorario = async function(opcion, opciones) {
  const resultado = await SISTEMAS4A.confirmarCita(opcion, opciones);
  
  if (resultado.success) {
    // Redireccionar a WhatsApp con confirmación
    const mensaje = `✅ *Cita Confirmada con Sistemas 4A*\n\n📅 ${new Date(resultado.fecha).toLocaleString('es-VE')}\n\nGracias por confiar en nosotros. Nos vemos pronto.`;
    window.open(`https://wa.me/584120317421?text=${encodeURIComponent(mensaje)}`, '_blank');
  }
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🧪 Sistemas 4A - Equipo Técnico IA v1.0 ACTIVO');
  console.log('📡 Webhook:', SISTEMAS4A.config.n8nUrl);
});

/**
 * USO EN TU CÓDIGO:
 * 
 * 1. Reemplaza tu función analyzeIA() por analyzeIATeam()
 * 
 * 2. O llama directamente:
 * 
 * await SISTEMAS4A.procesarConIA(
 *   'Mi servidor no enciende y hace ruido',
 *   { nombre: 'Juan', telefono: '04121234567', servicio: 'soporte' },
 *   imagenBase64 // opcional
 * );
 */