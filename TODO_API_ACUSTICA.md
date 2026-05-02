# Proyecto Futuro: OpenAcoustics API (Nombre en código)

**Objetivo:** Crear la primera API open-source y colaborativa de rangos vocales de anuros (y otras especies) para potenciar herramientas bioacústicas como Sonic Naturalist.

## ¿Por qué es necesario?
Actualmente, podemos obtener la *presencia* de una especie usando iNaturalist, pero no hay una base de datos pública y programable que responda a la pregunta: *"¿A qué frecuencia (Hz) canta esta especie?"*. Esto limita el análisis automatizado de espectrogramas.

## Arquitectura Propuesta

### 1. Estructura de Datos (Esquema Inicial)
Cada registro en la base de datos debería contener:
*   `taxon_id` (Relacionado con iNaturalist / GBIF)
*   `scientific_name`
*   `vocal_range`:
    *   `min_freq_hz`: Frecuencia mínima registrada.
    *   `max_freq_hz`: Frecuencia máxima registrada.
    *   `dominant_freq_hz`: Frecuencia con mayor energía (pico).
*   `call_type`: "Mating", "Territorial", "Distress".
*   `temporal_pattern`: "Pulsed", "Continuous", "Trill".
*   `references`: DOIs de los *papers* científicos que respaldan las mediciones.

### 2. Pila Tecnológica Sugerida
*   **Backend:** FastAPI (Python) para un rendimiento rápido y tipado fuerte (Pydantic), o Node.js.
*   **Base de Datos:** PostgreSQL con PostGIS si se planean consultas geoespaciales complejas, o MongoDB si el esquema es muy variable.
*   **Alojamiento (MVP):** Vercel o Render (Nivel Gratuito) + Supabase (PostgreSQL gratuito).

### 3. Modelo Colaborativo (Crowdsourcing Científico)
*   Crear un frontend sencillo donde biólogos de todo el mundo puedan buscar una especie, ingresar los datos de frecuencia medidos en sus investigaciones, y adjuntar el DOI de su *paper* como evidencia.
*   Implementar un sistema de validación ("Verificado por Curadores") similar a las identificaciones de grado de investigación en iNaturalist.

### 4. Integración Futura con Sonic Naturalist
Una vez que esta API exista, se reemplazará la función `_get_mock_vocal_range` en `ribbit_wrapper.py` por una llamada real a tu API:
```python
# Ejemplo futuro
resp = requests.get(f"https://api.openacoustics.org/v1/species/{taxon_id}/vocal_traits")
traits = resp.json()
min_f = traits["min_freq_hz"]
max_f = traits["max_freq_hz"]
```

## Próximos Pasos (Para ti)
1.  **Revisión de Literatura:** Empieza por recopilar las frecuencias de las 20 especies de ranas con las que más trabajas.
2.  **Diseño de la BD:** Crea un archivo Excel o CSV con las columnas propuestas para ver cómo se siente la estructura de datos empíricamente.
3.  **Lanzamiento del Repositorio:** Crea un repositorio en GitHub para el proyecto e invita a tus colegas del grupo de investigación a aportar datos a ese CSV inicial.
