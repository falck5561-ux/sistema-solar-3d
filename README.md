# Sistema Solar 3D

Experiencia web interactiva creada con Three.js y Vite. Incluye planetas animados, música distinta por mundo, cámara cinematográfica y una bailarina luciérnaga exclusiva de la Tierra.

## Ejecutar

```bash
npm install
npm run dev
```

Abre la dirección que muestre Vite, normalmente `http://localhost:5173/`.

## Colocar el icono de la pestaña

Copia tu imagen aquí:

```text
public/icono.png
```

El nombre debe ser exactamente `icono.png`. Se recomienda una imagen PNG cuadrada de 512 × 512 píxeles. Ya está configurada para usarse como favicon y como icono al guardar la página en un celular.

## Música por planeta

Coloca los MP3 dentro de `public/audio/`:

```text
sol.mp3
mercurio.mp3
venus.mp3
tierra.mp3
marte.mp3
jupiter.mp3
saturno.mp3
urano.mp3
neptuno.mp3
```

Usa minúsculas y evita acentos en los nombres.

## Personalizar la dedicatoria

Edita:

```text
src/data/experience.js
```

Ahí puedes cambiar el nombre, el texto del inicio y la nota especial de la Tierra sin modificar el resto del código.

## Controles

- Arrastrar: rotar la cámara.
- Pellizcar o usar la rueda: acercar y alejar.
- Deslizar horizontalmente en celular: cambiar de planeta.
- `Espacio`: pausar o reanudar.
- `C`: entrar o salir del modo cine.
- `O`: activar la cámara orbital.
- `B`: mostrar u ocultar el ballet luciérnaga.
- `Esc`: salir del modo cine.

## Mejoras de esta versión

- Nombre de proyecto y carpeta simplificados.
- Favicon preparado mediante `public/icono.png`.
- Navegación por gestos en celular.
- Vibración táctil ligera en dispositivos compatibles.
- Tarjeta compacta para abrir la nota de la Tierra.
- Estrella fugaz al revelar la dedicatoria.
- Ajustes específicos para celular vertical y horizontal.
- Botones con mejor respuesta táctil y navegación por teclado.
- Nuevo detalle informal en la pantalla de inicio.
- Se conserva el rendimiento estable, sin cambios dinámicos de resolución durante la animación.
