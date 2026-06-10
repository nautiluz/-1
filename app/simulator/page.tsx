'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Play, CheckCircle, XCircle, Code, GitMerge, Terminal, Trophy, Lock,
  Droplet, Archive, HeartPulse, Info, Network, BookOpen, GraduationCap
} from 'lucide-react';

const PROBLEMAS = [
  {
    id: 1,
    title: "Gestión de Turnos (Comedor)",
    icon: <Droplet className="text-blue-400" />,
    statement: "El comedor universitario necesita un sistema para automatizar la entrega de almuerzos. El programa debe solicitar el ID del estudiante, buscar su saldo en la base de datos y, únicamente si el saldo es mayor a cero, asignarle un número de turno. Si el saldo es cero o negativo, debe negar el servicio y pedir que recargue su cuenta.",
    truthData: {
      title: "Evaluación Condicional: Saldo Positivo",
      headers: ["Escenario (Saldo)", "Expresión: saldo > 0", "Resultado Lógico", "Flujo de Ejecución"],
      rows: [
        ["Saldo: 15.50", "15.50 > 0", "Verdadero", "Genera turno y entrega comida"],
        ["Saldo: 0.00", "0.00 > 0", "Falso", "Denegado: Muestra error"],
        ["Saldo: -5.00", "-5.00 > 0", "Falso", "Denegado: Muestra error"]
      ]
    },
    pseudo: `Algoritmo ComedorUniversitario
    Definir id_estudiante Como Cadena
    Definir saldo, turno Como Real
    
    Escribir "Ingrese ID de estudiante:"
    Leer id_estudiante
    
    // Consultamos una base de datos
    saldo <- ConsultarSaldo(id_estudiante) 
    
    Si saldo > 0 Entonces
        turno <- GenerarNumeroTurno()
        Escribir "Turno asignado: ", turno
        Escribir "Estado: Bandeja lista para retiro"
    Sino
        Escribir "Error: Saldo insuficiente. Recargue su cuenta."
    FinSi
FinAlgoritmo`,
    mermaid: `graph TD
      A([Inicio]) --> B[/Leer id_estudiante/]
      B --> C[ConsultarSaldo]
      C --> D{saldo > 0?}
      D -- Sí --> E[turno = GenerarNumeroTurno]
      E --> F[/Imprimir Turno y Estado/]
      D -- No --> G[/Imprimir Error: Saldo insuficiente/]
      F --> H([Fin])
      G --> H`,
    questions: [
      { q: "¿Qué estructura de control principal se utiliza aquí?", options: ["Ciclo Mientras", "Condicional Simple (Si-Entonces)", "Ciclo Repetir"], answer: 1 },
      { q: "Si el estudiante tiene un saldo de 0.00, ¿qué ocurre?", options: ["Se le asigna turno", "Da error por saldo insuficiente", "El programa se cuelga"], answer: 1 }
    ]
  },
  {
    id: 2,
    title: "Control de Acceso (Puerta)",
    icon: <Lock className="text-red-400" />,
    statement: "Diseñar un sistema de seguridad para una puerta inteligente. El usuario tiene un máximo de 3 intentos para ingresar. Puede entrar digitando el código '1234' o presentando una tarjeta 'NFC_TOKEN'. Si agota los 3 intentos sin éxito, el sistema bloquea la puerta y alerta a seguridad.",
    truthData: {
      title: "Operador Lógico OR (O) y Ciclo Mientras",
      headers: ["Código Ingresado", "Tarjeta Presentada", "Cod=='1234' O Tarj=='NFC_TOKEN'", "Resultado Lógico"],
      rows: [
        ["1234", "Ninguna", "Verdadero O Falso", "Verdadero (Concedido)"],
        ["0000", "NFC_TOKEN", "Falso O Verdadero", "Verdadero (Concedido)"],
        ["1234", "NFC_TOKEN", "Verdadero O Verdadero", "Verdadero (Concedido)"],
        ["0000", "Ninguna", "Falso O Falso", "Falso (Denegado -> Suma intento)"]
      ]
    },
    pseudo: `Algoritmo ControlAcceso
    Definir intentos Como Entero
    Definir codigo, tarjeta Como Cadena
    intentos <- 0
    
    Mientras intentos < 3 Hacer
        Escribir "Ingrese código o presente tarjeta:"
        Leer codigo, tarjeta
        
        Si codigo == "1234" O tarjeta == "NFC_TOKEN" Entonces
            Escribir "Acceso concedido. Bienvenida/o."
            intentos <- 4 // Salida forzada del ciclo
        Sino
            intentos <- intentos + 1
            Escribir "Acceso denegado. Intento ", intentos, " de 3."
        FinSi
    FinMientras
    
    Si intentos == 3 Entonces
        Escribir "Puerta bloqueada. Contacte a seguridad."
    FinSi
FinAlgoritmo`,
    mermaid: `graph TD
      A([Inicio]) --> B[intentos = 0]
      B --> C{intentos < 3?}
      C -- Sí --> D[/Leer codigo, tarjeta/]
      D --> E{codigo=='1234' O tarjeta=='NFC_TOKEN'?}
      E -- Sí --> F[/Imprimir 'Acceso concedido'/]
      F --> G[intentos = 4]
      G --> C
      E -- No --> H[intentos = intentos + 1]
      H --> I[/Imprimir 'Acceso denegado'/]
      I --> C
      C -- No --> J{intentos == 3?}
      J -- Sí --> K[/Imprimir 'Puerta bloqueada'/]
      J -- No --> L([Fin])
      K --> L`,
    questions: [
      { q: "¿Por qué se asigna 'intentos <- 4' cuando el acceso es concedido?", options: ["Para dar más intentos", "Para bloquear la puerta", "Para forzar la salida del ciclo Mientras"], answer: 2 },
      { q: "¿Qué operador lógico permite entrar con código O con tarjeta?", options: ["Operador Y (AND)", "Operador O (OR)", "Operador NO (NOT)"], answer: 1 }
    ]
  },
  {
    id: 3,
    title: "Riego Automatizado",
    icon: <Droplet className="text-cyan-400" />,
    statement: "Crear un sistema infinito para un invernadero que monitoree la humedad de la tierra. Si el sensor detecta que la humedad cae por debajo del 30%, debe encender la bomba de agua. El proceso de verificación debe repetirse automáticamente cada 10 minutos para mantener las plantas vivas.",
    truthData: {
      title: "Evaluación de Umbral y Ciclo Infinito",
      headers: ["Lectura del Sensor", "Evaluación: humedad < 30.0", "Resultado Lógico", "Estado de la Bomba"],
      rows: [
        ["Humedad: 25%", "25 < 30", "Verdadero", "ON (Activando bomba)"],
        ["Humedad: 30%", "30 < 30", "Falso", "OFF (Bomba apagada)"],
        ["Humedad: 60%", "60 < 30", "Falso", "OFF (Bomba apagada)"]
      ]
    },
    pseudo: `Algoritmo RiegoInvernadero
    Definir humedad_actual, umbral Como Real
    umbral <- 30.0 // Porcentaje mínimo
    
    Repetir
        humedad_actual <- LeerSensorHumedad()
        
        Si humedad_actual < umbral Entonces
            Escribir "Humedad baja: Activando bomba de agua."
        Sino
            Escribir "Humedad óptima: Bomba apagada."
        FinSi
        
        Esperar 10 Minutos
    Hasta Que (1 == 0) // Ciclo infinito
FinAlgoritmo`,
    mermaid: `graph TD
      A([Inicio]) --> B[umbral = 30.0]
      B --> C[/Leer humedad_actual/]
      C --> D{humedad_actual < umbral?}
      D -- Sí --> E[/Imprimir 'Activando bomba'/]
      D -- No --> F[/Imprimir 'Bomba apagada'/]
      E --> G[Esperar 10 Minutos]
      F --> G
      G --> H{1 == 0?}
      H -- Falso --> C`,
    questions: [
      { q: "¿Qué tipo de ciclo es 'Repetir ... Hasta Que'?", options: ["Ciclo controlado por contador", "Ciclo con evaluación al final", "Ciclo que nunca se ejecuta"], answer: 1 },
      { q: "¿Por qué se usa la condición (1 == 0) al final?", options: ["Es un error de sintaxis", "Para crear un ciclo infinito (siempre falso)", "Para detener el riego"], answer: 1 }
    ]
  },
  {
    id: 4,
    title: "Control de Inventario",
    icon: <Archive className="text-yellow-400" />,
    statement: "Desarrollar un sistema de gestión de inventario para reactivos químicos en un laboratorio. El sistema inicia con 20 unidades. Debe permitir registrar 'Entradas' (sumar) o 'Salidas' (restar) ingresando la cantidad. Si después de la operación el inventario es menor a 5 unidades, debe lanzar una ALERTA crítica.",
    truthData: {
      title: "Bifurcación de Operaciones y Alerta",
      headers: ["Operación Solicitada", "Eval: op == 'Entrada'", "Stock Resultante (Inicio 20)", "Eval: stock < 5"],
      rows: [
        ["Entrada de 10", "Verdadero -> Suma", "30", "Falso (Sin alerta)"],
        ["Salida de 5", "Falso -> Resta", "15", "Falso (Sin alerta)"],
        ["Salida de 16", "Falso -> Resta", "4", "Verdadero (ALERTA CRÍTICA)"]
      ]
    },
    pseudo: `Algoritmo InventarioLaboratorio
    Definir stock_actual, cantidad Como Entero
    Definir operacion Como Cadena
    stock_actual <- 20
    
    Escribir "Operación (Entrada/Salida):"
    Leer operacion
    Escribir "Ingrese cantidad:"
    Leer cantidad
    
    Si operacion == "Entrada" Entonces
        stock_actual <- stock_actual + cantidad
    Sino
        stock_actual <- stock_actual - cantidad
    FinSi
    
    Escribir "Stock actualizado: ", stock_actual
    
    Si stock_actual < 5 Entonces
        Escribir "ALERTA: Stock crítico. Realizar pedido."
    FinSi
FinAlgoritmo`,
    mermaid: `graph TD
      A([Inicio]) --> B[stock_actual = 20]
      B --> C[/Leer operacion, cantidad/]
      C --> D{operacion == 'Entrada'?}
      D -- Sí --> E[stock = stock + cantidad]
      D -- No --> F[stock = stock - cantidad]
      E --> G[/Imprimir stock_actual/]
      F --> G
      G --> H{stock_actual < 5?}
      H -- Sí --> I[/Imprimir ALERTA/]
      H -- No --> J([Fin])
      I --> J`,
    questions: [
      { q: "Si el stock actual es 20 y ocurre una 'Salida' de 16, ¿qué sucede?", options: ["El stock es 4, muestra ALERTA", "El stock es 4, no muestra alerta", "El stock es 36"], answer: 0 },
      { q: "¿Qué ocurre si el usuario ingresa como operación 'Retiro'?", options: ["Dará error el programa", "Se ejecutará como 'Salida' por el 'Sino'", "No hará nada"], answer: 1 }
    ]
  },
  {
    id: 5,
    title: "Asistente Nutricional",
    icon: <HeartPulse className="text-pink-400" />,
    statement: "Construir una calculadora que asigne una meta calórica base a un paciente dependiendo de su nivel de actividad (1: Baja = 2000 cal, 2: Alta = 2500 cal). Luego, debe ajustar el plan según el peso: Si pesa más de 90kg, restar 500 cal (Reducción). Si pesa menos de 60kg, sumar 500 cal (Aumento). Si está en el medio, mantener las calorías base (Mantenimiento).",
    truthData: {
      title: "Condicionales Anidados (Árbol de Decisión)",
      headers: ["Datos Paciente", "Eval: Actividad", "Eval: peso > 90", "Eval: peso < 60", "Plan Resultante"],
      rows: [
        ["100kg, Act:1", "1 -> 2000 cal", "Verdadero", "No se evalúa", "Reducción: 1500 cal"],
        ["55kg, Act:2", "2 -> 2500 cal", "Falso", "Verdadero", "Aumento: 3000 cal"],
        ["75kg, Act:1", "1 -> 2000 cal", "Falso", "Falso", "Mantenimiento: 2000 cal"]
      ]
    },
    pseudo: `Algoritmo CalculadoraCalorias
    Definir peso, edad, actividad, calorias_objetivo Como Real
    
    Escribir "Ingrese peso(kg), edad y actividad (1-Baja, 2-Alta):"
    Leer peso, edad, actividad
    
    Si actividad == 1 Entonces
        calorias_objetivo <- 2000
    Sino
        calorias_objetivo <- 2500
    FinSi
    
    Si peso > 90 Entonces
        Escribir "Plan: Reducción. Objetivo: ", calorias_objetivo - 500
    Sino Si peso < 60 Entonces
        Escribir "Plan: Aumento. Objetivo: ", calorias_objetivo + 500
    Sino
        Escribir "Plan: Mantenimiento. Objetivo: ", calorias_objetivo
    FinSi
FinAlgoritmo`,
    mermaid: `graph TD
      A([Inicio]) --> B[/Leer peso, edad, actividad/]
      B --> C{actividad == 1?}
      C -- Sí --> D[calorias = 2000]
      C -- No --> E[calorias = 2500]
      D --> F{peso > 90?}
      E --> F
      F -- Sí --> G[/Imprimir Plan: Reducción/]
      F -- No --> H{peso < 60?}
      H -- Sí --> I[/Imprimir Plan: Aumento/]
      H -- No --> J[/Imprimir Plan: Mantenimiento/]
      G --> K([Fin])
      I --> K
      J --> K`,
    questions: [
      { q: "¿Qué estructura se utiliza para evaluar el peso?", options: ["Ciclos anidados", "Condicionales múltiples (Si-Sino Si)", "Arreglos multidimensionales"], answer: 1 },
      { q: "Para una persona de 95kg con actividad 2 (Alta), ¿cuál es el objetivo final?", options: ["2500", "2000", "3000"], answer: 1 }
    ]
  }
];

const MermaidViewer = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.mermaid) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
        renderChart();
      };
      document.body.appendChild(script);
    } else {
      renderChart();
    }

    async function renderChart() {
      if (ref.current && window.mermaid) {
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        try {
          const { svg } = await window.mermaid.render(id, chart);
          ref.current.innerHTML = svg;
        } catch (e) {
          console.error("Mermaid error", e);
        }
      }
    }
  }, [chart]);

  return (
    <div ref={ref} className="flex justify-center items-center overflow-x-auto p-4 bg-slate-800 rounded-xl min-h-[300px] border border-slate-700 shadow-inner">
      Cargando diagrama...
    </div>
  );
};

const TruthTableViewer = ({ truthData }) => {
  if (!truthData) return null;
  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
          <Network className="mr-2 text-purple-400" size={24} /> {truthData.title}
        </h3>
        <p className="text-slate-300">
          Analiza cómo las computadoras evalúan las condiciones (Verdadero / Falso) para tomar decisiones antes de ejecutar el bloque de código correspondiente.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700 shadow-[0_0_20px_rgba(168,85,247,0.05)]">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-purple-400 font-mono border-b border-slate-700">
            <tr>
              {truthData.headers.map((h, i) => (
                <th key={i} className="px-6 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-900/50 divide-y divide-slate-800 font-mono">
            {truthData.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/80 transition-colors">
                {row.map((cell, j) => {
                  const isTrue = cell.includes("Verdadero") || cell.includes("ON") || cell.includes("Concedido") || cell.includes("Suma");
                  const isFalse = cell.includes("Falso") || cell.includes("OFF") || cell.includes("Denegado") || cell.includes("Error") || cell.includes("ALERTA") || cell.includes("Resta");

                  let cellClass = "px-6 py-4 whitespace-nowrap ";
                  if (isTrue) cellClass += "text-emerald-400 font-bold";
                  else if (isFalse) cellClass += "text-red-400 font-bold";

                  return <td key={j} className={cellClass}>{cell}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 md:px-6 py-4 font-medium text-sm transition-colors ${
      active
        ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-800'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const SimulatorEngine = ({ problem, onComplete }) => {
  const [logs, setLogs] = useState(["[Terminal Iniciada] Lista para la simulación..."]);

  useEffect(() => {
    setLogs(["[Terminal Iniciada] Lista para la simulación..."]);
  }, [problem.id]);

  const addLog = (msg, type = "info") => {
    const color = type === "error" ? "text-red-400" : type === "success" ? "text-emerald-400" : "text-slate-300";
    setLogs(prev => {
      const span = document.createElement('span');
      span.className = color;
      span.textContent = `> ${msg}`;
      return [...prev, { text: `> ${msg}`, className: color }];
    });
  };

  const ConsoleWindow = () => (
    <div className="bg-[#0a0a0a] border border-slate-700 rounded-xl p-4 mt-6 h-64 overflow-y-auto font-mono text-sm shadow-inner flex flex-col space-y-1">
      {logs.map((log, i) => (
        <div key={i} className={log.className}>{log.text}</div>
      ))}
    </div>
  );

  const Sim1 = () => {
    const [saldo, setSaldo] = useState("");
    const run = () => {
      const s = parseFloat(saldo);
      if (isNaN(s)) { addLog("Error: Entrada inválida. Se esperaba un número real.", "error"); return; }
      addLog(`Consultando saldo en base de datos para estudiante...`);
      if (s > 0) {
        addLog(`Condición (saldo > 0) -> VERDADERA`);
        addLog(`Turno asignado: ${Math.floor(Math.random() * 100) + 1}`, "success");
        addLog(`Estado: Bandeja lista para retiro`, "success");
        onComplete();
      } else {
        addLog(`Condición (saldo > 0) -> FALSA`, "error");
        addLog(`Error: Saldo insuficiente. Recargue su cuenta.`, "error");
        onComplete();
      }
    };
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-slate-300">Ingresa un saldo positivo, cero o negativo para probar la condición del "Si-Entonces".</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-1">Variable: saldo ($)</label>
            <input type="number" value={saldo} onChange={e => setSaldo(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Ej: 15.50" />
          </div>
          <button onClick={run} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition flex items-center justify-center">
            <Play size={18} className="mr-2" /> Ejecutar Código
          </button>
        </div>
      </div>
    );
  };

  const Sim2 = () => {
    const [intentos, setIntentos] = useState(0);
    const [codigo, setCodigo] = useState("");
    const [locked, setLocked] = useState(false);

    const reset = () => { setIntentos(0); setLocked(false); setLogs(["[Sistema Reiniciado] Ciclo 'Mientras' reseteado."]); };

    const run = () => {
      if (locked) return;
      if (codigo === "1234" || codigo === "NFC_TOKEN") {
        addLog(`Condición OR -> VERDADERA`);
        addLog(`Acceso concedido. Bienvenida/o.`, "success");
        addLog(`Modificando variable: intentos <- 4 (Salida forzada)`, "success");
        setLocked(true);
        onComplete();
      } else {
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);
        addLog(`Condición OR -> FALSA`, "error");
        addLog(`Acceso denegado. Intento ${nuevosIntentos} de 3.`, "error");
        if (nuevosIntentos >= 3) {
          addLog(`Evaluación final (intentos == 3) -> VERDADERA`);
          addLog(`Puerta bloqueada. Contacte a seguridad.`, "error");
          setLocked(true);
          onComplete();
        }
      }
      setCodigo("");
    };

    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-slate-300">Tienes hasta 3 ciclos (intentos) para ingresar la llave correcta. (Clave: 1234 o NFC_TOKEN).</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-400 mb-1">Entrada: codigo o tarjeta</label>
            <input disabled={locked} type="text" value={codigo} onChange={e => setCodigo(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50" placeholder="Escribe aquí..." />
          </div>
          <button disabled={locked} onClick={run} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-6 py-3 rounded-lg font-bold transition flex items-center justify-center">
            Probar Entrada
          </button>
          <button onClick={reset} className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition">Reiniciar</button>
        </div>
        <div className="text-sm font-mono text-slate-400">Estado de memoria: intentos = {intentos}</div>
      </div>
    );
  };

  const Sim3 = () => {
    const [humedad, setHumedad] = useState(40);
    const run = () => {
      addLog(`Lectura: humedad_actual <- ${humedad}%`);
      if (humedad < 30) {
        addLog(`Condición (${humedad} < 30) -> VERDADERA`);
        addLog(`Humedad baja: Activando bomba de agua.`, "success");
      } else {
        addLog(`Condición (${humedad} < 30) -> FALSA`);
        addLog(`Humedad óptima: Bomba apagada.`);
      }
      addLog(`... Comando: Esperar 10 Minutos ...`);
      onComplete();
    };
    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-slate-300">Mueve el deslizador para alterar la variable de entorno 'humedad_actual' y fuerza la lectura del ciclo.</p>
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Sensor de Humedad: {humedad}% (Umbral Programado: 30%)</label>
            <input type="range" min="0" max="100" value={humedad} onChange={e => setHumedad(e.target.value)} className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
          </div>
          <button onClick={run} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-bold transition w-full sm:w-64 mx-auto flex items-center justify-center">
            <Play size={18} className="mr-2" /> Ejecutar Ciclo de Monitoreo
          </button>
        </div>
      </div>
    );
  };

  const Sim4 = () => {
    const [stock, setStock] = useState(20);
    const [op, setOp] = useState("Entrada");
    const [cant, setCant] = useState("");

    const run = () => {
      const c = parseInt(cant);
      if (isNaN(c) || c < 0) { addLog("Error: Ingrese una cantidad entera positiva.", "error"); return; }

      let nuevoStock = stock;
      if (op === "Entrada") {
        addLog(`Condición (operacion == "Entrada") -> VERDADERA`);
        nuevoStock += c;
        addLog(`Memoria: stock_actual <- ${stock} + ${c}`);
      } else {
        addLog(`Condición (operacion == "Entrada") -> FALSA (Rama Sino)`);
        nuevoStock -= c;
        addLog(`Memoria: stock_actual <- ${stock} - ${c}`);
      }

      setStock(nuevoStock);
      addLog(`Impresión: Stock actualizado: ${nuevoStock}`, "success");

      if (nuevoStock < 5) {
        addLog(`Evaluación Final: (${nuevoStock} < 5) -> VERDADERA`, "error");
        addLog(`ALERTA: Stock crítico. Realizar pedido.`, "error");
      } else {
        addLog(`Evaluación Final: (${nuevoStock} < 5) -> FALSA (Fin del algoritmo)`);
      }
      onComplete();
    };

    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-slate-300">Modifica el estado en memoria ejecutando Entradas o Salidas. Trata de generar la alerta de stock crítico.</p>
        <div className="text-xl font-mono text-yellow-400 mb-2 border-b border-slate-700 pb-2 inline-block">Variable [stock_actual] = {stock}</div>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 items-end">
          <div className="w-full sm:w-1/3">
            <label className="block text-sm text-slate-400 mb-1">Variable: operacion</label>
            <select value={op} onChange={e => setOp(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none">
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
            </select>
          </div>
          <div className="w-full sm:w-1/3">
            <label className="block text-sm text-slate-400 mb-1">Variable: cantidad</label>
            <input type="number" value={cant} onChange={e => setCant(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none" placeholder="Ej: 5" />
          </div>
          <button onClick={run} className="w-full sm:w-1/3 bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold transition">
            Ejecutar Lógica
          </button>
        </div>
      </div>
    );
  };

  const Sim5 = () => {
    const [peso, setPeso] = useState("");
    const [actividad, setActividad] = useState("1");

    const run = () => {
      const p = parseFloat(peso);
      const act = parseInt(actividad);
      if (isNaN(p)) { addLog("Error: Variable 'peso' no válida.", "error"); return; }

      let calorias_objetivo = 0;
      if (act === 1) {
        addLog(`Eval: (actividad == 1) -> VERDADERA`);
        calorias_objetivo = 2000;
        addLog(`Memoria: calorias_objetivo <- 2000`);
      } else {
        addLog(`Eval: (actividad == 1) -> FALSA`);
        calorias_objetivo = 2500;
        addLog(`Memoria: calorias_objetivo <- 2500`);
      }

      if (p > 90) {
        addLog(`Anidado Eval: (peso > 90) -> VERDADERA`, "success");
        addLog(`Plan: Reducción. Objetivo: ${calorias_objetivo - 500}`, "success");
      } else if (p < 60) {
        addLog(`Anidado Eval: (peso > 90) -> FALSA, Probando (peso < 60) -> VERDADERA`, "success");
        addLog(`Plan: Aumento. Objetivo: ${calorias_objetivo + 500}`, "success");
      } else {
        addLog(`Anidado Eval: Todas FALSAS -> Ejecutando SINO final`);
        addLog(`Plan: Mantenimiento. Objetivo: ${calorias_objetivo}`);
      }
      onComplete();
    };

    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-slate-300">Prueba los árboles de decisión condicional múltiple (Si - Sino Si - Sino).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingresar: peso (Kg)</label>
            <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none" placeholder="Ej: 75" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Ingresar: actividad</label>
            <select value={actividad} onChange={e => setActividad(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:outline-none">
              <option value="1">1 - Baja</option>
              <option value="2">2 - Alta</option>
            </select>
          </div>
        </div>
        <button onClick={run} className="w-full mt-4 bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-lg font-bold transition">
          Ejecutar Algoritmo
        </button>
      </div>
    );
  };

  const renderSim = () => {
    switch (problem.id) {
      case 1: return <Sim1 />;
      case 2: return <Sim2 />;
      case 3: return <Sim3 />;
      case 4: return <Sim4 />;
      case 5: return <Sim5 />;
      default: return null;
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <Terminal className="mr-2" /> Consola de Simulación
      </h3>
      {renderSim()}
      <ConsoleWindow />
    </div>
  );
};

const QuizEngine = ({ problem, completed, onComplete }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers({});
    setSubmitted(completed || false);
  }, [problem.id, completed]);

  const handleSubmit = () => {
    if (submitted) return;

    let correctCount = 0;
    problem.questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) correctCount++;
    });

    setSubmitted(true);
    if (!completed) {
      onComplete(correctCount * 50);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6 pb-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Reto Analítico</h3>
        <p className="text-slate-400">Demuestra tu comprensión del código para ganar XP.</p>
        {completed && <div className="mt-4 inline-flex px-4 py-2 bg-emerald-900/50 rounded-full text-emerald-400 font-bold justify-center items-center"><CheckCircle className="mr-2" size={18} /> Reto Superado</div>}
      </div>

      {problem.questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-slate-800/80 p-6 rounded-xl border border-slate-700 shadow-lg">
          <p className="font-semibold text-lg mb-4 text-white">{qIndex + 1}. {q.q}</p>
          <div className="space-y-3">
            {q.options.map((opt, oIndex) => {
              const isSelected = answers[qIndex] === oIndex;
              const isCorrect = submitted && q.answer === oIndex;
              const isWrong = submitted && isSelected && q.answer !== oIndex;

              let btnClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";
              if (!submitted) {
                btnClass += isSelected ? "bg-slate-700 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300";
              } else {
                if (isCorrect) btnClass += "bg-emerald-900/40 border-emerald-500 text-emerald-300 font-bold";
                else if (isWrong) btnClass += "bg-red-900/40 border-red-500 text-red-300";
                else btnClass += "bg-slate-900 border-slate-700 text-slate-500 opacity-50";
              }

              return (
                <button
                  key={oIndex}
                  disabled={submitted}
                  onClick={() => setAnswers({ ...answers, [qIndex]: oIndex })}
                  className={btnClass}
                >
                  <div className="flex justify-between items-center">
                    <span>{opt}</span>
                    {submitted && isCorrect && <CheckCircle size={18} className="text-emerald-500" />}
                    {submitted && isWrong && <XCircle size={18} className="text-red-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length !== problem.questions.length}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
        >
          Enviar Respuestas y Reclamar XP
        </button>
      )}
    </div>
  );
};

export default function SimulatorPage() {
  const [currentProblem, setCurrentProblem] = useState(PROBLEMAS[0]);
  const [score, setScore] = useState(0);
  const [activeTab, setActiveTab] = useState('pseudocode');
  const [completedLevels, setCompletedLevels] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});

  const addScore = (points) => {
    setScore(prev => prev + points);
  };

  const markSimulationComplete = (id) => {
    if (!completedLevels[id]) {
      setCompletedLevels(prev => ({ ...prev, [id]: true }));
      addScore(100);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Simulador Algorítmico
          </h1>
          <p className="text-slate-400 mt-1">Laboratorio de Lógica - <span className="text-emerald-400 font-semibold">Prof. Ing. Angel Rodriguez</span></p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center bg-slate-800 px-6 py-3 rounded-full border border-slate-600 shadow-inner">
          <Trophy className="text-yellow-400 mr-3 animate-pulse" size={24} />
          <span className="text-2xl font-bold text-white">{score} <span className="text-sm text-slate-400 font-normal">XP</span></span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-300 mb-4 px-2">Módulos de Práctica</h2>
          {PROBLEMAS.map((prob) => (
            <button
              key={prob.id}
              onClick={() => {
                setCurrentProblem(prob);
                setActiveTab('pseudocode');
              }}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between border ${
                currentProblem.id === prob.id
                  ? 'bg-slate-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${currentProblem.id === prob.id ? 'bg-slate-700' : 'bg-slate-800'}`}>
                  {prob.icon}
                </div>
                <div>
                  <div className="text-sm text-slate-400">Problema {prob.id}</div>
                  <div className="font-semibold text-slate-200 text-sm">{prob.title}</div>
                </div>
              </div>
              {completedLevels[prob.id] && <CheckCircle className="text-emerald-500" size={18} />}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col h-full min-h-[600px] shadow-2xl">
          <div className="flex border-b border-slate-700 bg-slate-800/50 flex-wrap">
            <TabButton icon={<Code size={18} />} label="Enunciado y Código" active={activeTab === 'pseudocode'} onClick={() => setActiveTab('pseudocode')} />
            <TabButton icon={<Network size={18} />} label="Árbol de Verdad" active={activeTab === 'truth'} onClick={() => setActiveTab('truth')} />
            <TabButton icon={<GitMerge size={18} />} label="Diagrama" active={activeTab === 'diagram'} onClick={() => setActiveTab('diagram')} />
            <TabButton icon={<Play size={18} />} label="Simulador" active={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')} />
            <TabButton icon={<CheckCircle size={18} />} label="Reto (Quiz)" active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
          </div>

          <div className="p-6 flex-grow overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-slate-950">
            {activeTab === 'pseudocode' && (
              <div className="animate-fade-in space-y-6">
                <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                    <Info className="mr-2 text-blue-400" size={20} /> Enunciado del Problema
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                    {currentProblem.statement}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Code className="mr-2 text-emerald-400" size={20} /> Pseudocódigo
                  </h3>
                  <pre className="bg-[#0d1117] p-6 rounded-xl overflow-x-auto text-emerald-400 font-mono text-sm border border-slate-800 shadow-inner">
                    <code>{currentProblem.pseudo}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'truth' && (
              <TruthTableViewer truthData={currentProblem.truthData} />
            )}

            {activeTab === 'diagram' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                  <GitMerge className="mr-2 text-indigo-400" size={20} /> Diagrama de Flujo
                </h3>
                <p className="text-slate-400 text-sm mb-4">Representación visual del flujo de ejecución del algoritmo leyendo de arriba hacia abajo.</p>
                <MermaidViewer chart={currentProblem.mermaid} />
              </div>
            )}

            {activeTab === 'simulator' && (
              <SimulatorEngine
                problem={currentProblem}
                onComplete={() => markSimulationComplete(currentProblem.id)}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizEngine
                problem={currentProblem}
                completed={completedQuizzes[currentProblem.id]}
                onComplete={(score) => {
                  setCompletedQuizzes(prev => ({ ...prev, [currentProblem.id]: true }));
                  addScore(score);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
