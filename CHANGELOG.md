# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-01-14

### Agregado
- **Comando `voto espectro`**: Visualización del espectro político de los partidos
  - Vista general con posiciones de izquierda a derecha
  - Opción `-d` para descripciones detalladas de cada partido
  - Comparación de distancia ideológica entre dos partidos (`voto espectro FA PLP`)
  - Clasificación en dos ejes: económico (Estado ◄─► Mercado) y social (Progresista ◄─► Conservador)
- Clasificación ideológica de los 20 partidos políticos

## [1.0.0] - 2026-01-12

### Agregado
- **Comando `voto quiz`**: Quiz interactivo para descubrir afinidad con candidatos
  - Preguntas sobre prioridades, enfoque económico, CCSS, seguridad, ambiente y género
  - Recomendación de Top 3 candidatos basada en respuestas
- **Comando `voto chat`**: Asistente IA para preguntas sobre candidatos
  - Soporte para Ollama (local), OpenAI, Claude y Gemini
  - Contexto completo de transcripciones de entrevistas
- **Comando `voto ask`**: Preguntas rápidas al asistente IA
- **Comando `voto config`**: Configuración del proveedor de LLM
- **Comando `voto candidatos`**: Lista de los 20 candidatos presidenciales
- **Comando `voto perfil`**: Perfil detallado de un candidato
- **Comando `voto comparar`**: Comparación de temas entre dos candidatos
- **Comando `voto buscar`**: Búsqueda de términos en todas las entrevistas
- **Comando `voto temas`**: Temas más discutidos en las entrevistas
- **Comando `voto leer`**: Lectura de transcripciones completas
- **Comando `voto explorar`**: Modo interactivo guiado

### Datos incluidos
- 20 entrevistas del TSE (una por candidato)
- 3 debates oficiales del TSE
- 15 entrevistas adicionales (No Pasa Nada, Sepamos Ser Libres, En Profundidad)
- 20 planes de gobierno en PDF

---

## Tipos de cambios

- **Agregado** para funcionalidades nuevas.
- **Cambiado** para cambios en funcionalidades existentes.
- **Obsoleto** para funcionalidades que serán eliminadas próximamente.
- **Eliminado** para funcionalidades eliminadas.
- **Arreglado** para corrección de errores.
- **Seguridad** para vulnerabilidades.
