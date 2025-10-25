# Comandos Rápidos - Gestabiz Mobile

## 🚀 Desarrollo

### Iniciar App Móvil
```bash
# Desde la raíz del proyecto
npm run mobile

# O desde mobile/
cd mobile
npm start
```

### Android
```bash
npm run mobile:android
# O presiona 'a' cuando la app esté corriendo
```

### iOS
```bash
npm run mobile:ios
# O presiona 'i' cuando la app esté corriendo
```

### Web (para testing)
```bash
npm run dev
# La app móvil cargará http://localhost:5173 automáticamente en modo dev
```

---

## 🔧 Setup

### Primera Vez
```bash
cd mobile
npm install
```

**Nota**: Variables de entorno se sincronizan automáticamente desde la raíz. No necesitas crear `.env` en mobile/.

---

## 🐛 Troubleshooting

### Limpiar Cache
```bash
cd mobile
npx expo start -c
```

### Reinstalar Dependencias
```bash
cd mobile
rm -rf node_modules
npm install
```

### Reset Metro Bundler
```bash
cd mobile
npx expo start --clear
```

---

## 📱 Testing

### Deep Linking (mientras app está corriendo)
```bash
# iOS
npx uri-scheme open "gestabiz://app/client" --ios

# Android
npx uri-scheme open "gestabiz://app/admin" --android
```

---

## 🏗️ Build (Futuro)

### EAS Build
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Ambos
eas build --platform all
```

### Submit to Stores
```bash
# Android
eas submit --platform android

# iOS
eas submit --platform ios
```

---

## 📊 Verificación

### Check Setup
```bash
npx tsx mobile/scripts/check-setup.ts
```

---

## 🆘 Comandos de Emergencia

### App no inicia
```bash
cd mobile
rm -rf node_modules .expo
npm install
npx expo start -c
```

### WebView en blanco
1. Verificar que web app esté corriendo: `npm run dev`
2. Verificar URL en `mobile/lib/env-config.ts`
3. Reload app: Shake device → "Reload"

### Session no funciona
1. Logout
2. Cerrar app completamente
3. Volver a abrir
4. Login nuevamente

---

## 📚 Documentación

```bash
# Leer documentación
cat mobile/README.md
cat mobile/RESUMEN_EJECUTIVO.md
cat mobile/TESTING.md
```

---

## ⚡ Atajos de Teclado (mientras app corre)

- `a` - Abrir en Android emulator
- `i` - Abrir en iOS simulator
- `w` - Abrir en web browser
- `r` - Reload app
- `m` - Toggle menu
- `d` - Open developer menu (shake device en físico)
- `j` - Open debugger
- `c` - Clear cache y restart

---

## 🎯 Workflow Típico

### Desarrollo Diario
```bash
# Terminal 1
npm run dev

# Terminal 2  
npm run mobile
# Presionar 'a' o 'i'
# Hacer cambios en código web
# Hot reload automático ✨
```

### Testing de Nueva Feature
```bash
# 1. Implementar feature en web
npm run dev

# 2. Verificar en web browser
open http://localhost:5173

# 3. Verificar en mobile
npm run mobile
# Presionar 'a' o 'i'

# 4. Si funciona en ambos → commit ✅
```

---

## 🔍 Debugging

### Ver Logs en Tiempo Real
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### Inspeccionar WebView (Chrome DevTools)
1. Abrir Chrome
2. Ir a `chrome://inspect`
3. Buscar "Gestabiz WebView"
4. Click "inspect"

---

## 📦 Dependencias

### Agregar Nueva Dependencia
```bash
cd mobile
npm install <paquete>
```

### Actualizar Dependencias
```bash
cd mobile
npm update
```

### Verificar Dependencias Vulnerables
```bash
cd mobile
npm audit
```

---

## 🌐 URLs Útiles

- **Expo Dashboard**: https://expo.dev
- **Supabase Dashboard**: https://supabase.com/dashboard
- **EAS Builds**: https://expo.dev/builds
- **TestFlight** (iOS): https://appstoreconnect.apple.com
- **Play Console** (Android): https://play.google.com/console

---

## 💡 Tips

### Para Desarrollo Rápido
- Usa emulador en vez de dispositivo físico (más rápido)
- Mantén web app corriendo localmente (hot reload)
- Usa `npx expo start -c` si ves comportamiento extraño

### Para Testing de Producción
- Usa dispositivo físico (push notifications)
- Conecta a web app de producción (cambia `__DEV__` a false)
- Habilita Hermes para mejor performance

### Para Deploy
- Siempre probar build localmente primero
- Verificar que todas las variables de entorno estén en EAS Secrets
- Incrementar versionCode/buildNumber en cada build

