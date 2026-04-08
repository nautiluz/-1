# CleanMailBox

🧹 Limpia tu Gmail con IA local - Código Abierto

## Proyectos

Este repositorio contiene dos proyectos:

### 1. Web App (GitHub Pages)
- **Ubicación:** Raíz del proyecto
- **Tech:** Next.js 14 + TypeScript + Tailwind CSS
- **URL:** `https://tu-usuario.github.io/CleanMailBox/`

### 2. Extensión de Chrome
- **Ubicación:** `extension/`
- **Tech:** Vanilla JS + Chrome APIs + Transformers.js (IA local)

---

## 🚀 Instalación - Web App

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para GitHub Pages
npm run build

# Desplegar (requiere gh-pages)
npm run deploy
```

### Configuración

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilita la **Gmail API**
3. Crea credenciales **OAuth 2.0 Client ID** (tipo: Chrome Extension o Web)
4. Copia `.env.example` a `.env.local` y agrega tus credenciales:

```env
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback
```

---

## 🔧 Instalación - Extensión de Chrome

1. Ve a `extension/`
2. Reemplaza `YOUR_CLIENT_ID` en:
   - `manifest.json`
   - `popup/popup.js`
   - `dashboard/main.js`
   - `scripts/background.js`

3. Abre Chrome y ve a `chrome://extensions/`
4. Activa **"Modo de desarrollador"**
5. Clic en **"Cargar descomprimida"**
6. Selecciona la carpeta `extension/`

### Permisos de la Extensión

La extensión requiere estos permisos:
- `identity` - OAuth2
- `storage` - Guardar reglas
- `gmail.readonly` - Leer correos
- `gmail.modify` - Eliminar/archivar

---

## 📊 Funcionalidades

### Web App
- Dashboard con estadísticas
- Top remitentes (eliminar por remitente)
- Reglas de limpieza (antigüedad, tamaño, remitente)
- Interfaz moderna con Tailwind

### Extensión de Chrome
- Popup rápido con acciones comunes
- Dashboard completo para gestión
- Resumen de newsletters con IA local (Transformers.js)
- Reglas personalizables guardadas en storage

---

## 🔒 Privacidad

- **Web:** Los datos se procesan en el servidor API de Next.js
- **Extensión:** 100% local - IA procesa en el navegador usando WebGPU/WASM
- Ningún dato sale de tu máquina

---

## 📁 Estructura

```
CleanMailBox/
├── app/                    # Next.js App Router
│   ├── api/gmail/         # API routes
│   └── page.tsx           # Main UI
├── components/            # UI components
├── lib/                   # Utilities
├── extension/             # Chrome Extension
│   ├── manifest.json     # Extension config
│   ├── popup/            # Extension popup
│   ├── dashboard/        # Full dashboard
│   ├── scripts/          # Background worker
│   └── lib/              # Transformers.js
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## ⚠️ Advertencias

1. **Extensión:** Al eliminar correos, se eliminan permanentemente
2. **Cuota:** La API de Gmail tiene límites (100 req/segundo)
3. **IA Local:** El modelo requiere ~200MB de descarga primera vez

---

## 📝 Licencia

MIT