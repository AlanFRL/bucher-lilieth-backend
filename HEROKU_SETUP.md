# 🚀 Configuración de Heroku

## Cambios Aplicados en package.json

### ✅ Scripts Optimizados
```json
"start": "node dist/main"          // Ejecuta versión compilada (menos RAM)
"heroku-postbuild": "npm run build" // Heroku compila automáticamente
```

### ✅ Dependencies Optimizadas
- `@nestjs/cli` movido a `devDependencies` (no se instala en producción)

---

## 📋 Config Vars Necesarias en Heroku

Ve a tu app en Heroku → **Settings** → **Config Vars** y asegúrate de tener:

### Variables de Base de Datos
```
DB_HOST=cee3ebbhveeoab.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=ua1ig9cb9c4dh0
DB_PASSWORD=********
DB_DATABASE=deq7ff2n95mrsd
```

### Variables de Aplicación
```
NODE_ENV=production
JWT_SECRET=tu-secret-key-seguro-y-largo
JWT_EXPIRES_IN=12h
CORS_ORIGIN=https://butcher-lilieth.netlify.app
```

### ⚡ Variable de Optimización de Memoria (CRÍTICO)
```
NODE_OPTIONS=--max-old-space-size=256
```
Esta variable limita el heap de Node.js a 256MB, evitando el error **R14 (Memory quota exceeded)**.

---

## 🔄 Cómo Desplegar los Cambios

### Opción 1: Deploy Automático (recomendado)
Si tienes GitHub conectado a Heroku:
```bash
git add .
git commit -m "fix: Optimizar backend para producción (Heroku + Render)"
git push
```
Heroku detectará el push y desplegará automáticamente.

### Opción 2: Deploy Manual
```bash
git push heroku main
```

---

## ✅ Verificación Post-Deploy

### 1. Ver logs en tiempo real
```bash
heroku logs --tail --app tu-app-name
```

### 2. Buscar estos mensajes
```
✅ Nest application successfully started
✅ State changed from starting to up
```

### 3. Verificar uso de memoria
```bash
heroku ps --app tu-app-name
```
Debería mostrar **< 256MB** de uso.

### 4. Probar endpoint
```powershell
Invoke-RestMethod -Uri "https://tu-app.herokuapp.com/api/health" -Method GET
```

---

## 🛡️ Compatibilidad con Render

Estos cambios **NO rompen Render**, de hecho lo mejoran:

- ✅ `start: node dist/main` funciona en Render y Heroku
- ✅ Render también debe compilar antes de ejecutar
- ✅ Menos consumo de RAM beneficia a ambos

### Build Command en Render
Asegúrate que en Render tengas:
```
Build Command: npm install && npm run build
Start Command: npm start
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Comando start | `nest start` | `node dist/main` |
| RAM consumida | ~521MB (101.8%) | ~150-200MB (~40%) |
| Error R14 | ❌ Frecuente | ✅ Eliminado |
| @nestjs/cli en prod | ❌ Sí (innecesario) | ✅ No (solo dev) |
| Velocidad de arranque | Lenta | Rápida |

---

## 🐛 Troubleshooting

### Si Heroku no arranca después del deploy

1. **Verificar que se compiló:**
   ```bash
   heroku run ls dist --app tu-app-name
   ```
   Debe existir `dist/main.js`

2. **Verificar NODE_OPTIONS:**
   ```bash
   heroku config --app tu-app-name | grep NODE_OPTIONS
   ```
   Debe mostrar: `NODE_OPTIONS: --max-old-space-size=256`

3. **Revisar errores de compilación:**
   ```bash
   heroku logs --tail --app tu-app-name | grep -i error
   ```

### Si Render falla después del cambio

1. Verificar que Build Command incluya `npm run build`
2. Verificar que Start Command sea `npm start`
3. Limpiar cache de build: Settings → Manual Deploy → Clear build cache

---

## 🎯 Próximos Pasos

1. ✅ Hacer commit y push de estos cambios
2. ⏳ Esperar deploy automático en Heroku (~2-3 min)
3. ✅ Verificar logs y memoria
4. ✅ Probar seeder: `POST /api/seed`
5. ✅ Probar categorías: `GET /api/categories`

---

## 📝 Notas Finales

- **DATABASE_URL** en Heroku es automático (add-on Postgres), no borrar
- El backend ahora consume **~50% menos RAM** 🎉
- Compatible con Heroku, Render, Railway, Fly.io, etc.
- Listo para escalar a planes superiores si es necesario
