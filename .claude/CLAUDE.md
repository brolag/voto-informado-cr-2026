# Voto Informado CR 2026

Sistema de investigación política para las elecciones presidenciales de Costa Rica 2026.

## Propósito

Ayudar a votantes a informarse sobre los candidatos presidenciales usando transcripciones de entrevistas y debates oficiales.

## Datos Disponibles

- **20 candidatos** presidenciales
- **38 documentos** transcritos:
  - 20 entrevistas oficiales del TSE
  - 3 debates del TSE
  - Entrevistas de programas: No Pasa Nada, Sepamos Ser Libres, En Profundidad, Hablando Claro

## Comandos CLI

```bash
voto candidatos        # Lista de candidatos
voto perfil PLN        # Perfil de un candidato
voto comparar PLN PUSC # Comparar dos candidatos
voto buscar educación  # Buscar términos
voto temas             # Temas más discutidos
voto explorar          # Modo interactivo
```

## Estructura

```
data/
  pdfs/              # Planes de gobierno (20 PDFs)
  transcripts/       # VTT originales
  processed/         # Texto limpio
  knowledge-base.json
src/
  cli.js             # Interfaz de comandos
  process-data.js    # Convertidor VTT → TXT
  build-knowledge-base.js
```

## Siglas de Partidos

| Siglas | Partido | Candidato |
|--------|---------|-----------|
| PLN | Liberación Nacional | Álvaro Ramos |
| PUSC | Unidad Social Cristiana | Juan Carlos Hidalgo |
| CAC | Coalición Acción Ciudadana | Claudia Dobles |
| FA | Frente Amplio | Ariel Robles |
| PLP | Liberal Progresista | Eliécer Feinzaig |
| PNR | Nueva República | Fabricio Alvarado |
| UP | Unidos Podemos | Natalia Díaz |
| PPSO | Pueblo Soberano | Laura Fernández |

## Para Consultas Avanzadas

Cuando el usuario quiera análisis más profundos, cargar el archivo de texto relevante:

```javascript
// Ejemplo: data/processed/TSE-01-PJSC-Walter_Hernandez.txt
```

Los PDFs de planes de gobierno están en `data/pdfs/` y requieren OCR para lectura completa.

## No Requiere RAG

Este sistema funciona sin RAG porque:
1. Los datos están pre-procesados y estructurados
2. El knowledge-base.json tiene índices por candidato y tema
3. La búsqueda de texto es suficiente para la mayoría de consultas
4. Claude puede razonar sobre el contexto cargado directamente
