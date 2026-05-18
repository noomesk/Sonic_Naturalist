# DEMO EN VIVO: Sonic Naturalist para Biólogos de Campo
**Formato:** Acción en pantalla simultánea a la narración.
**Audiencia:** Biólogos de campo, ecólogos y conservacionistas.

---

## 1. Subida del Archivo e Introducción Práctica

*(Narrador hace clic en "Subir Audio", selecciona un archivo pesado de 4 minutos y lo carga en la plataforma. Aparece el status "Procesando")*

"Compañeros, buenas tardes. Para quienes venimos del campo, un monitor acústico pasivo instalado en una selva tropical no es más que una caja ciega. Recolecta cientos de horas de grabaciones, y escuchar todo eso para encontrar el instante en que nuestra especie objetivo decide cantar es, literalmente, agotador.

Lo que acabo de subir es una grabación ininterrumpida de varios minutos obtenida en campo. En segundos, **Sonic Naturalist** va a extraer el alma acústica de este ecosistema y nos lo va a entregar en un formato que nuestros ojos biológicos sí pueden procesar al instante: un Espectrograma de Alta Resolución."

---

## 2. Abriendo el Espectrograma (Lectura Inicial)

*(El espectrograma termina de cargar. La gráfica inmensa aparece en pantalla, con sus colores fríos y cálidos)*

"Miren esto. Este panel no es un reproductor moderno de música, es un lienzo de investigación de 4 minutos enteros. Nuestra vista está optimizada para buscar patrones, no nuestros oídos. Aquí, convertimos el sonido en topografía.

Déjenme ubicarlos rápidamente en este panel:
*   De izquierda a derecha, **el avance del tiempo**.
*   De abajo hacia arriba, **la frecuencia en Hertz (Hz)**. Observen que la escala llega sólo hasta los 8000 Hz. Lo hemos ajustado intencionalmente como un filtro biológico: 8000 Hz es la zona dorada o 'nicho acústico' principal donde habitan casi todas las vocalizaciones de nuestras ranas y sapos de interés.
*   Y finalmente, **los colores (Decibelios)**. Es la intensidad. El azul profundo u oscuro representa los vacíos; el silencio nocturno de la selva o el ruido basal. A medida que nos acercamos al amarillo, naraja y al rojo intenso, significa que un organismo u objeto físico ha detonado energía puramente acústica frente a la membrana del micrófono."

---

## 3. Identificación Visual de Anuros (Reproducción y Zoom)

*(El narrador da clic en PLAY. La aguja verde brillante comienza a correr arrastrando y haciendo paneo a la imagen del espectrograma a medida que el audio suena)*

"Voy a darle Play. Noten cómo la aguja rastrea en tiempo real el paso del tiempo. Mientras lo escuchan, no tienen que adivinar qué están oyendo.

Fíjense en estas franjas que se ven a lo largo de la pantalla. Si encontramos líneas amarillas o verde-suaves **constantes y gruesas de de forma totalmente horizontal**, ese es nuestro ecosistema inanimado. Ese piso constante suele significar ruido de un arroyo, la lluvia lejana o el zumbido abrumador y constante de las cigarras de fondo en altas frecuencias.

Pero nosotros estamos buscando anfibios. 
*(El narrador pausa el audio justo frente a un cúmulo de 'manchas' rojas y utiliza la barra de zoom para enmarcar esos 3 o 4 segundos específicos)*

He aislado estos segundos. ¿Ven estas **'estrías' verticales, gotas o pilares filosos de color rojo encendido**? Esa es la huella digital inconfundible del canto de un anuro. Las ranas utilizan mecanismos neumáticos y sacos vocales que producen 'pulsos' de energía o chirridos ultrarrápidos, los cuales abarcan muchas frecuencias a la vez. Por eso vemos líneas verticales repetitivas. Y al notar cómo se repiten rítmicamente en el tiempo, estamos, literalmente, *viendo el comportamiento de cortejo*.

*(El narrador para el cursor sobre la punta roja del canto de la rana. Los valores de tooltip en el panel interactivo aparecen)*

Si posiciono mi mouse justo en el cénit rojizo de esta especie, nuestra herramienta interactiva me entrega inmediatamente una coordenada biométrica: **El pico exacto de Frecuencia Dominante (Hz) y su Potencia exacta en Decibelios (dB)**. Esto les permite a ustedes anotar métricas de análisis en sus cuadernos de laboratorio sin necesidad de abrir un software privativo de computadora. Está todo en el navegador."

---

## 4. El Futuro (Modelos IA Específicos para Ranas)

*(El narrador achica el zoom, volviendo a mostrar los 4 minutos completos)*

"Nuestra funcionalidad actual soluciona la lectura e interpretación humana fluida. Pero, como biólogos, nuestro objetivo final es cruzar datos masivos. Si dejamos un micrófono grabando una semana entera, tendríamos miles de estas hojas fotográficas.

Hacia allá se dirige el futuro de Sonic Naturalist. Al tener estas representaciones visuales perfectas de los cantos (esos picos rojos verticales de las ranas), estamos en la etapa fundacional para introducir Modelos de Inteligencia Artificial (Redes Neuronales).
Vamos a enseñar a la computadora a jugar *'¿Dónde Está Wally?'* con los picos rojos bioacústicos. El motor escaneará semanas de espectrogramas por su cuenta, detectará y dibujará automáticamente cajas encima de todas las siluetas que pertenezcan a *Centrolenidae* o *Dendrobatidae*, y les reportará a ustedes cuántas especies cantaron y a qué horas. 
Nosotros automatizaremos el escrutinio masivo, para que ustedes, los biólogos, dediquen su valioso tiempo únicamente a auditar y validar los hallazgos raros de la naturaleza."

---

## 5. El Analista Experto Virtual (Intérprete en Tiempo Real)

*(El narrador hace scroll hacia la caja de texto dinámica debajo del espectrograma)*

"Y de hecho, ya tenemos un primer vistazo de esto. Justo debajo del visor, hemos implementado una **Transcripción Bioacústica en Tiempo Real**. A medida que el audio avanza, nuestra IA analiza los umbrales de amplitud y frecuencia, y genera un libreto científico dinámico que explica lo que sus ojos están viendo. Si suben un archivo nuevo ahora mismo, la plataforma no solo lo dibujará, sino que se los explicará."

---

## 6. El Cierre (Detalles Técnicos y de Desarrollo)

"Para lograr que esto fluya sin problemas, y para quienes disfrutan conocer los "hierros" que lo sostienen...
Dejamos los clásicos visores Javascript que colapsan en la web al intentar dibujar cientos de miles de frecuencias al mismo tiempo. Construímos un motor de alta envergadura usando **Python y librerías científicas (Librosa)** directo del lado del servidor. El servidor mastica minutos enteros, procesa el peso y lo comprime devolviéndonos una 'fotografía' topográfica puramente nítida de Base64, superponiéndola a nuestra interfaz web. Esto nos permite un paneo de 4 minutos HD continuo, ágil e interactivo sin que la computadora de sus oficinas de campo se sobrecaliente.

Muchas gracias, espero disfruten de la interfaz. Pueden tomar el mando para subir sus propias pruebas de campo."
*(Fin de Ponencia)*
